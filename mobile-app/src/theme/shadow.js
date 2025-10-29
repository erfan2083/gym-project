export const shadow = (elev = 6) => ({
  shadowColor: "#000",
  shadowOffset: { width: 0, height: Math.round(elev / 2) },
  shadowOpacity: 0.3,
  shadowRadius: elev,
  elevation: elev,
});
