export const tabBarLayout = (insets, fontScale = 1) => {
  const paddingBottom = Math.max(insets.bottom, 8);
  return {
    height: Math.max(64, Math.ceil(48 + fontScale * 16)) + paddingBottom,
    paddingBottom, paddingTop: 6,
    backgroundColor: '#FFFFFF', borderTopColor: '#EAECF0',
  };
};
