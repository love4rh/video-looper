# Video Looper (for practicing listening)
동영상과 자막 파일을 자막 기준으로 편리하게 반복 재생하며 영어(다른 언어) 듣기 연습을 할 수 있는 웹앱


## Features
- 로컬 디스크에 있는 동영상과 자막 파일 선택
- 자막파일은 SRT 포맷 지원
- 자막 단위별로 선택하여 반복 재생
- 반복 회수 지정
- 전체 자막 순차 재생 / 현재 자막만 재생
- 동영상과 자막에 따라 여러 언어에 사용 가능
- 자막 시간 편집 기능


## Libraries in Use
- [react](https://reactjs.org/)
- [react-bootstrap](https://react-bootstrap.github.io/)
- [node-sass](https://www.npmjs.com/package/node-sass)
- [react-icons](https://react-icons.github.io/react-icons/)


## Usage
(TBD)


## Hot Keys
Hot Key|기능|비고
:---|:---|:---
`space`|현재 스크립트 재생/중지|실행 중인 것이 없다면 처음부터 실행함
`←`|음량 낮춤|
`→`|음량 높임|
`↑`|이전 스크립트|
`↓`|다음 스트립트|


## 자막 조정
현재 재생 중인 자막의 시간 및 재생 시간을 조절하기 위하여 다음 기능을 이용할 수 있음.

Hot Key|기능|비고
:---|:---|:---
`,(<)`|현재 자막 시작 시간 0.5초 감소|
`.(>)`|현재 자막 시작 시간 0.5초 증가|
`ctrl+,(<)`|현재 자막 포함하여 이후 자막의시작 시간 0.5초 모두 감소|
`ctrl+.(>)`|현재 자막 포함하여 이후 자막의시작 시간 0.5초 모두 증가|
`shift+,(<)`|현재 자막 지속 시간 0.5초 감소|
`shift+.(>)`|현재 자막 지속 시간 0.5초 증가|
`ctrl+shift+↑`|현재 자막을 위로 합치기|되돌릴 수 없음
`ctrl+shift+↓`|자막 파일로 내려받기|


## Future Works
- 스트리밍 방식 지원
- SMI, VTT 등 다양한 자막파일 포맷 지원
