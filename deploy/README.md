# 파일럿 배포 (홈랩 k3s + Cloudflare Tunnel)

설계: [`extracting-the-human-mind/architecture/pilot.md`](../extracting-the-human-mind/architecture/pilot.md)

```
인터넷 ─ Cloudflare Tunnel ─ web (Next.js, :3000) ─ api (FastAPI, :8000, 클러스터 내부 전용) ─ SQLite (PVC)
```

- 외부에 공개되는 것은 `web` 하나다. `api`는 NetworkPolicy로 `web` 파드에서만 접근된다.
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

## Cloudflare Tunnel (cloudflared는 호스트, 입구는 Traefik)

전제: 도메인의 DNS가 Cloudflare에 있어야 한다(무료 플랜 가능).

1. **터널 만들기** (이미 홈랩용 터널이 있으면 건너뛰고 3으로): Cloudflare 대시보드 → **Networking > Tunnels** → **Create a tunnel** → 이름 입력 → **Create Tunnel** → 호스트 OS를 고르면 나오는 설치 명령을 호스트 터미널에서 실행(cloudflared가 토큰과 함께 서비스로 설치된다) → 상태가 연결됨으로 바뀌면 **Continue**.
2. **라우트 추가**: 그 터널 → **Routes** 탭 → **Add route** → **Published application** → subdomain(예: `pilot`)과 Domain 선택 → **Service URL** `http://192.168.0.4:80` → **Add route**. Traefik(k3s 기본, 노드 80번 포트)이 Host 헤더로 `web`을 찾는다. cloudflared가 같은 노드에서 돌더라도 `localhost`보다 노드 IP가 안전하다(k3s의 80번은 hostPort라 루프백으로는 안 잡히는 경우가 있다).
3. **Ingress 호스트 맞추기**: `deploy/k8s/ingress.yaml`의 `host: pilot.example.invalid`를 2의 호스트명으로 바꾸고 `kubectl apply -k deploy/k8s`.
4. **확인**: `https://<호스트명>` → 랜딩 화면. Traefik의 404면 3의 호스트명이 2와 다르다. Cloudflare 502/1033이면 cloudflared가 연결 안 됐거나 `192.168.0.4:80`에 닿지 못한다.

로컬 설정 파일(`config.yml`)로 관리하는 터널이면 같은 라우트를 `ingress:`에 `hostname: <호스트명>` · `service: http://192.168.0.4:80`로 추가하고, 마지막 규칙은 `service: http_status:404`로 둔다.

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
