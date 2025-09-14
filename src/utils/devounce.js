export const debounce = (func, delay) => {
  let timeoutid;
  return function (...args) {
    const context = this;
    clearTimeout(timeoutid);
    timeoutid = setTimeout(() => {
      func.apply(context, args);
    }, delay);
  };
};
