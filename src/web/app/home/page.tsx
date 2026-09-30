"use client";

import { Card, NavLinks, Title } from "@/components/ui";
import { useMe } from "@/lib/useMe";

export default function Home() {
  const { me } = useMe();
  if (!me) return <p className="text-muted">불러오는 중…</p>;

  return (
    <>
      <Title sub="준비된 과제부터 차례로 열려요. 한 번에 다 하지 않아도 괜찮아요.">{me.nickname} 님, 반가워요</Title>
      <Card tone="sage">
        <p className="font-medium">첫 과제를 준비하고 있어요.</p>
        <p className="mt-1 text-sm text-muted">과제가 열리면 여기에 차례대로 나타나요.</p>
      </Card>
      <NavLinks />
    </>
  );
}
