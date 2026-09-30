# 파일럿 배포 (홈랩 k3s + Cloudflare Tunnel)

설계: [`extracting-the-human-mind/architecture/pilot.md`](../extracting-the-human-mind/architecture/pilot.md)

```
인터넷 ─ Cloudflare ─ cloudflared(호스트) ─ web NodePort 30380 (Next.js) ─ api (FastAPI, 클러스터 내부 전용) ─ SQLite (PVC)
```

- 외부에 공개되는 것은 `web` 하나다. `api`는 NetworkPolicy로 `web` 파드에서만 접근된다.
- HTTPS는 Cloudflare 엣지에서 끝난다. 참가자 응답은 Cloudflare 구간을 복호화된 채 지나며, 동의 화면 '내 데이터는'에 이를 밝힌다.
- 이미지는 `main`에 푸시될 때 GitHub Actions(`.github/workflows/pilot-images.yml`)가 테스트 후 빌드해 GHCR에 올린다: `ghcr.io/yitanjang/ethm-pilot-api`, `ghcr.io/yitanjang/ethm-pilot-web` (태그 `latest`, `sha-xxxxxxx`).

## 처음 한 번

```bash
# 1) 네임스페이스와 관리자 토큰 (토큰은 커밋하지 않는다)
kubectl create namespace ethm-pilot
kubectl -n ethm-pilot create secret generic pilot-secrets --from-literal=admin-token="$(openssl rand -hex 32)"

# 2) 배포
kubectl apply -k deploy/k8s

# 3) 확인
kubectl -n ethm-pilot get pods
kubectl -n ethm-pilot port-forward svc/web 3000:3000   # http://localhost:3000
```

GHCR 패키지가 비공개로 생성됐다면 GitHub → Packages → 각 패키지 → Package settings에서 Public으로 바꾸거나, `imagePullSecrets`를 추가한다.

## Cloudflare Tunnel (cloudflared는 호스트 → `web` NodePort)

터널은 k3s의 공용 입구(Traefik, 80번)가 아니라 `web` 서비스의 NodePort **30380**으로 직접 보낸다. Traefik으로 보내면 클러스터 안의 host 없는 다른 Ingress까지 파일럿 호스트명으로 인터넷에 노출될 수 있기 때문이다 — 이렇게 하면 터널로 닿는 것은 이 앱 하나다.

전제: 도메인의 DNS가 Cloudflare에 있어야 한다(무료 플랜 가능).

1. **터널 만들기** (이미 홈랩용 터널이 있으면 건너뛰고 2로): Cloudflare 대시보드 → **Networking > Tunnels** → **Create a tunnel** → 이름 입력 → **Create Tunnel** → 호스트 OS를 고르면 나오는 설치 명령을 호스트 터미널에서 실행(cloudflared가 토큰과 함께 서비스로 설치된다) → 상태가 연결됨으로 바뀌면 **Continue**.
2. **라우트 추가**: 그 터널 → **Routes** 탭 → **Add route** → **Published application** → subdomain(예: `pilot`)과 Domain 선택 → **Service URL** `http://192.168.0.4:30380` → **Add route**. cloudflared가 같은 노드에서 돌더라도 `localhost`보다 노드 IP가 안전하다.
3. **확인**: `https://<호스트명>` → 랜딩 화면. Cloudflare 502/1033이면 cloudflared가 연결 안 됐거나 `192.168.0.4:30380`에 닿지 못한다(`kubectl -n ethm-pilot get svc web`로 NodePort 확인).

로컬 설정 파일(`config.yml`)로 관리하는 터널이면 같은 라우트를 `ingress:`에 `hostname: <호스트명>` · `service: http://192.168.0.4:30380`로 추가하고, 마지막 규칙은 `service: http_status:404`로 둔다.

### 보안 체크

- Cloudflare 계정에 2단계 인증을 켠다. 계정을 가진 사람은 이 터널에 라우트를 추가해 LAN의 어떤 주소든 공개할 수 있다.
- 터널 토큰(cloudflared 서비스 정의 안)은 비밀번호처럼 다룬다. 새면 터널을 지우고 새로 만든다.
- 필요 없으면 private network(CIDR) 라우트는 켜지 않는다.
- k3s가 `--disable-network-policy`로 설치되지 않았는지 확인한다(아니면 `networkpolicy.yaml`이 강제되지 않는다).

권장: `/admin` 경로에 Cloudflare Access 정책(본인 이메일만)을 걸어 관리자 화면을 이중으로 막는다.

## 업데이트

```bash
kubectl -n ethm-pilot rollout restart deploy/api deploy/web   # latest 태그를 다시 받는다
```

재현 가능한 배포가 필요하면 `kustomization.yaml`의 `newTag`를 `sha-xxxxxxx`로 고정한다.

## 데이터

- DB: PVC `pilot-data`의 `/data/pilot.db`. 매일 04:30 `db-backup` CronJob이 `/data/backups/`에 스냅샷(14개 보관).
- 이 백업은 같은 노드 안에 있다. 노드 장애 대비로 `/data/backups`를 다른 곳에 주기적으로 복사한다.
- 관리자 내보내기: 웹 `/admin` → 전체 내보내기 (JSON). 분석 전에 참가자별 용도 토글로 거른다.
