const themes = {
  light: {
    background: '#E8E0D8',
    containerBg: '#E8E0D8',
    boardBg: '#D8D0C8',
    cellBg: '#E0D8D0',
    titleText: '#4A5E72',
    subtitleText: '#8BA8C4',
    scoreCardBg: '#D8D0C8',
    scoreLabel: '#7A96B0',
    scoreValue: '#4A5E72',
    hintText: '#8BA8C4',
    buttonBg: '#7EB8E6',
    buttonText: '#FFFFFF',
    themeBtnBg: '#D8D0C8',
    overlayBg: 'rgba(232, 224, 216, 0.95)',
    titleGradient: ['#7EB8E6', '#A8D4FF'],
    scoreGradient: ['#7EB8E6', '#A8D4FF'],
    cardGradient: ['#D8D0C8', '#E8E0D8'],
    cardAccent: ['#7EB8E6', '#A8D4FF'],
    tiles: {
      2: { bg: '#E8DCC8', text: '#6B5D4F', glow: null },
      4: { bg: '#C0D8C8', text: '#3A6B50', glow: null },
      8: { bg: '#E89060', text: '#FFFFFF', glow: null },
      16: { bg: '#E87030', text: '#FFFFFF', glow: null },
      32: { bg: '#E8A020', text: '#FFFFFF', glow: null },
      64: { bg: '#D04828', text: '#FFFFFF', glow: null },
      128: { bg: '#C8A830', text: '#FFFFFF', glow: '#C8A830' },
      256: { bg: '#38A878', text: '#FFFFFF', glow: '#38A878' },
      512: { bg: '#3878B8', text: '#FFFFFF', glow: '#3878B8' },
      1024: { bg: '#5848A8', text: '#FFFFFF', glow: '#5848A8' },
      2048: { bg: '#883898', text: '#FFFFFF', glow: '#883898' },
      4096: { bg: '#A83058', text: '#FFFFFF', glow: '#A83058' },
      8192: { bg: '#882028', text: '#FFFFFF', glow: '#882028' }
    },
    popstarStars: [
      { bg: '#FF8BA0', bgEnd: '#E86080', starBg: '#FFA8B8', starBgEnd: '#E86080', starHighlight: 'rgba(255, 255, 255, 0.5)', starShadow: 'rgba(200, 50, 80, 0.55)', text: '#FFFFFF', glow: '#FF8BA0', highlight: 'rgba(255, 255, 255, 0.25)' },
      { bg: '#7EB8E6', bgEnd: '#5090C8', starBg: '#9DD0FF', starBgEnd: '#5090C8', starHighlight: 'rgba(255, 255, 255, 0.5)', starShadow: 'rgba(40, 90, 140, 0.55)', text: '#FFFFFF', glow: '#7EB8E6', highlight: 'rgba(255, 255, 255, 0.25)' },
      { bg: '#88D8B0', bgEnd: '#50B888', starBg: '#A8E8C8', starBgEnd: '#50B888', starHighlight: 'rgba(255, 255, 255, 0.5)', starShadow: 'rgba(40, 120, 80, 0.55)', text: '#FFFFFF', glow: '#88D8B0', highlight: 'rgba(255, 255, 255, 0.25)' },
      { bg: '#FFD466', bgEnd: '#E8B030', starBg: '#FFE090', starBgEnd: '#E8B030', starHighlight: 'rgba(255, 255, 255, 0.6)', starShadow: 'rgba(160, 120, 20, 0.55)', text: '#6B5D4F', glow: '#FFD466', highlight: 'rgba(255, 255, 255, 0.30)' },
      { bg: '#B8A0D8', bgEnd: '#9070B0', starBg: '#D0B8F0', starBgEnd: '#9070B0', starHighlight: 'rgba(255, 255, 255, 0.5)', starShadow: 'rgba(100, 60, 130, 0.55)', text: '#FFFFFF', glow: '#B8A0D8', highlight: 'rgba(255, 255, 255, 0.25)' },
      { bg: '#FFB070', bgEnd: '#E88040', starBg: '#FFC898', starBgEnd: '#E88040', starHighlight: 'rgba(255, 255, 255, 0.5)', starShadow: 'rgba(180, 80, 30, 0.55)', text: '#FFFFFF', glow: '#FFB070', highlight: 'rgba(255, 255, 255, 0.25)' }
    ],
    watersortTube: {
      wall: 'rgba(180, 200, 220, 0.6)',
      inner: 'rgba(240, 245, 250, 0.3)',
      highlight: 'rgba(255, 255, 255, 0.25)',
      rim: 'rgba(180, 200, 220, 0.7)',
      shadow: 'rgba(0, 0, 0, 0.06)'
    },
    watersortLiquids: [
      { light: '#FF6B8A', dark: '#E8506E', highlight: 'rgba(255,255,255,0.35)' },
      { light: '#5BA8E8', dark: '#4088C8', highlight: 'rgba(255,255,255,0.35)' },
      { light: '#5EC89A', dark: '#40A878', highlight: 'rgba(255,255,255,0.35)' },
      { light: '#FFD060', dark: '#E8B040', highlight: 'rgba(255,255,255,0.40)' },
      { light: '#B890D8', dark: '#9870B8', highlight: 'rgba(255,255,255,0.35)' },
      { light: '#FFA060', dark: '#E88040', highlight: 'rgba(255,255,255,0.35)' },
      { light: '#FF8CB8', dark: '#E87098', highlight: 'rgba(255,255,255,0.35)' },
      { light: '#50C8D8', dark: '#38A8B8', highlight: 'rgba(255,255,255,0.35)' },
      { light: '#C89068', dark: '#A87048', highlight: 'rgba(255,255,255,0.30)' },
      { light: '#A0A8B8', dark: '#808898', highlight: 'rgba(255,255,255,0.30)' }
    ]
  },
  dark: {
    background: '#0D1B2A',
    containerBg: '#0D1B2A',
    boardBg: '#1B3A5C',
    cellBg: '#0D1B2A',
    titleText: '#E8F0F8',
    subtitleText: '#6A8AAA',
    scoreCardBg: '#1B3A5C',
    scoreLabel: '#7A96B0',
    scoreValue: '#E8F0F8',
    hintText: '#6A8AAA',
    buttonBg: '#7EB8E6',
    buttonText: '#0D1B2A',
    themeBtnBg: '#1B3A5C',
    overlayBg: 'rgba(13, 27, 42, 0.95)',
    titleGradient: ['#88D8B0', '#6CD4A0'],
    scoreGradient: ['#7EB8E6', '#A8D4FF'],
    cardGradient: ['#1B3A5C', '#0D1B2A'],
    cardAccent: ['#88D8B0', '#6CD4A0'],
    tiles: {
      2: { bg: '#5A5048', text: '#D8D0C0', glow: null },
      4: { bg: '#3E5850', text: '#A8C8B8', glow: null },
      8: { bg: '#9A5838', text: '#FFFFFF', glow: null },
      16: { bg: '#AA5028', text: '#FFFFFF', glow: null },
      32: { bg: '#AA8020', text: '#FFFFFF', glow: null },
      64: { bg: '#C03820', text: '#FFFFFF', glow: null },
      128: { bg: '#B09028', text: '#FFFFFF', glow: '#B09028' },
      256: { bg: '#30A868', text: '#FFFFFF', glow: '#30A868' },
      512: { bg: '#3078B8', text: '#FFFFFF', glow: '#3078B8' },
      1024: { bg: '#5848A8', text: '#FFFFFF', glow: '#5848A8' },
      2048: { bg: '#883090', text: '#FFFFFF', glow: '#883090' },
      4096: { bg: '#A83058', text: '#FFFFFF', glow: '#A83058' },
      8192: { bg: '#902020', text: '#FFFFFF', glow: '#902020' }
    },
    popstarStars: [
      { bg: '#E87090', bgEnd: '#C05070', starBg: '#FF90B0', starBgEnd: '#C05070', starHighlight: 'rgba(255, 255, 255, 0.4)', starShadow: 'rgba(150, 30, 60, 0.65)', text: '#FFFFFF', glow: '#E87090', highlight: 'rgba(255, 255, 255, 0.15)' },
      { bg: '#5090C8', bgEnd: '#3070A8', starBg: '#70B0E8', starBgEnd: '#3070A8', starHighlight: 'rgba(255, 255, 255, 0.4)', starShadow: 'rgba(20, 60, 100, 0.65)', text: '#FFFFFF', glow: '#5090C8', highlight: 'rgba(255, 255, 255, 0.15)' },
      { bg: '#50B888', bgEnd: '#308868', starBg: '#70D8A8', starBgEnd: '#308868', starHighlight: 'rgba(255, 255, 255, 0.4)', starShadow: 'rgba(20, 90, 60, 0.65)', text: '#FFFFFF', glow: '#50B888', highlight: 'rgba(255, 255, 255, 0.15)' },
      { bg: '#E8B840', bgEnd: '#C89820', starBg: '#FFD060', starBgEnd: '#C89820', starHighlight: 'rgba(255, 255, 255, 0.5)', starShadow: 'rgba(130, 100, 10, 0.65)', text: '#0D1B2A', glow: '#E8B840', highlight: 'rgba(255, 255, 255, 0.20)' },
      { bg: '#9078B8', bgEnd: '#705898', starBg: '#B098D8', starBgEnd: '#705898', starHighlight: 'rgba(255, 255, 255, 0.4)', starShadow: 'rgba(70, 40, 100, 0.65)', text: '#FFFFFF', glow: '#9078B8', highlight: 'rgba(255, 255, 255, 0.15)' },
      { bg: '#E89050', bgEnd: '#C87030', starBg: '#FFB070', starBgEnd: '#C87030', starHighlight: 'rgba(255, 255, 255, 0.4)', starShadow: 'rgba(150, 70, 20, 0.65)', text: '#FFFFFF', glow: '#E89050', highlight: 'rgba(255, 255, 255, 0.15)' }
    ],
    watersortTube: {
      wall: 'rgba(100, 130, 170, 0.4)',
      inner: 'rgba(30, 50, 80, 0.3)',
      highlight: 'rgba(255, 255, 255, 0.15)',
      rim: 'rgba(100, 130, 170, 0.5)',
      shadow: 'rgba(0, 0, 0, 0.2)'
    },
    watersortLiquids: [
      { light: '#E86080', dark: '#C05070', highlight: 'rgba(255,255,255,0.25)' },
      { light: '#4890C8', dark: '#3070A8', highlight: 'rgba(255,255,255,0.25)' },
      { light: '#48B888', dark: '#309868', highlight: 'rgba(255,255,255,0.25)' },
      { light: '#E8B040', dark: '#C89020', highlight: 'rgba(255,255,255,0.30)' },
      { light: '#9078B8', dark: '#705898', highlight: 'rgba(255,255,255,0.25)' },
      { light: '#E88848', dark: '#C86828', highlight: 'rgba(255,255,255,0.25)' },
      { light: '#E878A8', dark: '#C85888', highlight: 'rgba(255,255,255,0.25)' },
      { light: '#40B0C0', dark: '#2890A0', highlight: 'rgba(255,255,255,0.25)' },
      { light: '#B88058', dark: '#986038', highlight: 'rgba(255,255,255,0.20)' },
      { light: '#9098A8', dark: '#707888', highlight: 'rgba(255,255,255,0.20)' }
    ]
  }
};

function getTheme(isDark) {
  return isDark ? themes.dark : themes.light;
}

module.exports = {
  themes,
  getTheme
};
