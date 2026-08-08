import "dotenv/config";
import { prisma } from "./db.js";

async function main() {
  const count = await prisma.notice.count();
  if (count > 0) {
    console.log(`Notices already seeded (${count}) — skipping.`);
    return;
  }

  await prisma.notice.createMany({
    data: [
      {
        titleKo: "쇼기 도장 온라인 대전 오픈",
        titleJa: "将棋道場 オンライン対局を公開しました",
        titleEn: "Online play is now open at Shogi Dojo",
        contentKo:
          "회원가입 후 로그인하시면 다른 사용자와 실시간으로 온라인 대국을 즐기실 수 있습니다. 서버가 모든 수를 검증하므로 안심하고 대국해 주세요. 대국이 끝나면 기보가 자동으로 저장되어 언제든지 복기할 수 있습니다.",
        contentJa:
          "会員登録してログインすると、他のユーザーとリアルタイムでオンライン対局を楽しめます。サーバーがすべての手を検証しますので、安心して対局してください。対局が終わると棋譜が自動的に保存され、いつでも振り返ることができます。",
        contentEn:
          "After creating an account and logging in, you can play real-time online games against other users. Every move is validated on the server, so you can play with confidence. Once a game ends, its record is saved automatically and can be replayed anytime.",
      },
      {
        titleKo: "초심자 튜토리얼 개편 안내",
        titleJa: "初心者向けチュートリアルを刷新しました",
        titleEn: "Beginner tutorial has been redesigned",
        contentKo:
          "쇼기를 처음 접하는 분들을 위한 튜토리얼을 단순히 읽는 방식에서, 직접 기물을 클릭하고 옮기며 배우는 방식으로 개선했습니다. 실제 대국에서 쓰는 것과 동일한 쇼기판과 규칙 엔진을 사용하므로, 튜토리얼에서 익힌 그대로 실전에서 사용하실 수 있습니다.",
        contentJa:
          "将棋が初めての方向けのチュートリアルを、読むだけの形式から、実際に駒をクリックして動かしながら学べる形式に改善しました。実際の対局と同じ将棋盤とルールエンジンを使用しているため、チュートリアルで覚えた通りに本番でも指すことができます。",
        contentEn:
          "The beginner tutorial has moved from plain reading to a hands-on format where you click and move real pieces. It uses the exact same board and rules engine as an actual game, so what you learn in the tutorial carries over directly to real play.",
      },
    ],
  });
  console.log("Seeded 2 notices.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
