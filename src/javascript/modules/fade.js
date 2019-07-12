const fade = (_=> {
  const out = element => {
    return new Promise((resolve, reject) => {
      let opacity = 1;
      const timer = setInterval(_ => {
          if (opacity <= 0.1){
              clearInterval(timer);
              element.style.display = 'none';
              resolve(true);
          }
          element.style.opacity = opacity;
          opacity -= opacity * 0.1;
      }, 25);
    });
  }
  
  const enter = element => {
    return new Promise((resolve, reject) => {
      let opacity = 0.1;
      element.style.display = 'block';
      const timer = setInterval(function () {
          if (opacity >= 1){
              clearInterval(timer);
          }
          element.style.opacity = opacity;
          opacity += opacity * 0.1;
      }, 25);
    });
  }
  
  return {
    outMany: selector => {
      return new Promise((resolve, reject) => {
        document.querySelectorAll(selector).forEach(element => {
          out(element)
            .then(_=> {
              setTimeout(_=> {
                resolve(true);
              }, 150);
            });  
        });
      });
    },
    
    enterMany: selector => {
      return new Promise((resolve, reject) => {
        document.querySelectorAll(selector).forEach(element => {
          enter(element);
        });
        resolve(true);
      });
    }
  }
})();

export default fade;
