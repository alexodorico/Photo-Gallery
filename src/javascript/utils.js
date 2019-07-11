const utils = (_=> {
  return {
    getById: function(id) {
      return document.getElementById(id);
    },
    
    scrollToTop: function() {
      return document.body.scrollTop = document.documentElement.scrollTop = 0;
    },
    
    destroyHTML: function(id) {
      return document.getElementById(id).innerHTML = new String();
    },
    
    getFromStorage: function(key) {
      return JSON.parse(window.localStorage.getItem(key)) || false;
    },
    
    putInStorage: function(key, value) {
      return localStorage.setItem(key, JSON.stringify(value));
    },

    showError: function(e) {
      return console.log(e);
    },

    addListenerToElements: function(query, event, handler) {
      const elements = document.querySelectorAll(query);
    
      Array.from(elements).forEach(element => {
        element.addEventListener(event, handler);
      });
    
      return true;
    }
  }
})();

export default utils;
