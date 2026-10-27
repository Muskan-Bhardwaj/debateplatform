// Compare ObjectIds / populated documents / strings safely.
export const sameId = (a, b) => String(a?._id ?? a) === String(b?._id ?? b);
