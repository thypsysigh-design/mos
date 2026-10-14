# 이매망량의 주인 — 산군

## PC에서 설치 없이 테스트

`playtest/mos-playtest.html`을 PC에 내려받아 Chrome 또는 Edge로 열면 됩니다.
계정, 서버, 인터넷 연결이 필요하지 않습니다. 같은 파일 경로와 브라우저에서 다시 열면
진행이 복원됩니다. 브라우저의 저장 설정, 시크릿 모드, 파일 경로 이동에 따라 기록이
유지되지 않을 수 있습니다. 이 파일은 PC 테스트용이며 모바일 설치 파일은 아닙니다.

개발자는 `EXPO_NO_TELEMETRY=1 EXPO_OFFLINE=1 npm run playtest`로 파일을 다시 만들 수 있습니다.

Android·iOS용 탐험형 텍스트 RPG 프로토타입. Expo와 React Native로 만들었습니다.
첨부된 조선 요괴사냥꾼 시안을 참고해 검사·무당·포수·승려가 사라진 누이를 찾아 북악산으로 들어가는 열흘의 모험을 구현했습니다.

## 플레이

- 8종의 사건과 대감신 보스 및 마지막 분기. 탐험 사건은 한 번씩 무작위 순서로 등장하고, 이후 일부가 재등장합니다.
- 요괴 전투: 전투 선택 시 직업 기술·방어·탕약을 자동으로 사용해 승패까지 진행합니다. 결과에 보상과 전체 전투 기록을 표시합니다.
- 전투 승리로 경험치·냥·유물·장비 획득. 장비 탭에서 무기와 부적을 착용합니다. 레벨 상승 시 최대 체력이 증가합니다.
- 선택 판정: 주사위 1~6 + 능력치 ≥ 난이도. 실패하면 체력을 잃을 수 있습니다.
- 냥으로 휴식하거나 유물을 구매합니다. 유물과 이전 선택이 마지막 선택을 바꿉니다.
- 5가지 결말, 현재 여정과 최근 30개의 결말을 기기에 자동 저장합니다.
- 오프라인 플레이. 계정·서버·결제 없이 동작하며 앱 삭제 시 기록이 사라집니다.

## 개발

Node.js 24, npm 11에서 검증했습니다.

```sh
cd /workspace/mos
npm ci
EXPO_NO_TELEMETRY=1 npm start
```

Expo Go에서 지원하는 SDK 버전과 프로젝트 SDK가 일치해야 합니다. 동일한 네트워크의
실제 기기에서 개발 서버를 연결하거나 네이티브 development build를 사용하세요.
클라우드의 개발 서버는 별도의 네트워크 연결 설정 없이는 휴대폰에서 접근할 수 없습니다.
브라우저 개발 확인은 `EXPO_NO_TELEMETRY=1 npm run web`입니다.

```sh
npm run typecheck
npm test
EXPO_NO_TELEMETRY=1 npm run export
```

`npm run export`는 JS/에셋 번들 생성이며 APK/IPA 설치 파일 생성은 아닙니다.

## 설치형 앱 빌드

EAS CLI로 Expo 계정에 로그인한 뒤 프로젝트를 연결합니다. 이 과정은 계정 접근과
외부 빌드가 필요하며 로컬 테스트와 별개입니다. `eas.json`에 내부 테스트용 프로필을 넣었습니다.

```sh
npx eas-cli login
npx eas-cli build:configure
npx eas-cli build --platform android --profile preview
npx eas-cli build --platform ios --profile preview
```

Android preview는 설치 가능한 APK를 만듭니다. 실제 iPhone 내부 배포에는 Apple Developer
멤버십, 서명 인증서와 등록된 테스트 기기가 필요합니다. 출시 전 `app.json`의 앱 식별자를
본인 소유 식별자로 확인하고 아이콘·스플래시·스토어 자료를 준비하세요.

## 구성

- `App.tsx`: 한국어 UI, 캐릭터 선택, 탐험, 여정, 모험집 및 자동 저장
- `src/game.ts`: UI와 분리된 시드 기반 사건·판정·결말 엔진
- `src/game.test.ts`: 재현성, 비용·체력, 분기, 전투·장비·성장·저장 및 400회 모험 시뮬레이션

모든 세계관과 문장은 이 프로토타입을 위해 새로 작성했습니다. 상용 출시 전 실제 기기에서
터치·글꼴·화면 크기·앱 재실행에 따른 저장 복원과 게임 밸런스를 추가 확인해야 합니다.
