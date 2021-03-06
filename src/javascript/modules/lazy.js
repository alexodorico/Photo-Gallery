const lazy = (_ => {
  return {
    setup: function() {
      var lazyImages = [].slice.call(document.querySelectorAll("img.lazy"));
      var active = false;

      if ("IntersectionObserver" in window) {
        var lazyImageObserver = new IntersectionObserver(function(
          entries,
          observer
        ) {
          entries.forEach(function(entry) {
            if (entry.isIntersecting) {
              var lazyImage = entry.target;
              lazyImage.src = lazyImage.dataset.src;
              lazyImage.classList.remove("lazy");
              lazyImageObserver.unobserve(lazyImage);
            }
          });
        });

        lazyImages.forEach(function(lazyImage) {
          lazyImageObserver.observe(lazyImage);
        });
      } else {
        var lazyLoad = function() {
          lazyImages.forEach(function(lazyImage) {
            lazyImage.src = lazyImage.getAttribute("data-src");
            if (lazyImage.classList) {
              lazyImage.classList.remove("lazy");
            } else {
              lazyImage.className.replace(/\bblazy\b/g, "");
            }

            lazyImages = lazyImages.filter(function(image) {
              return image !== lazyImage;
            });

            if (lazyImage.length === 0) {
              document.removeEventListener("scroll", lazyLoad);
              window.removeEventListener("resize", lazyLoad);
              window.removeEventListener("orientationchange", lazyLoad);
            }
          });
        };

        document.addEventListener("scroll", lazyLoad);
        window.addEventListener("resize", lazyLoad);
        window.addEventListener("orientationchange", lazyLoad);
        window.scroll(0, document.documentElement.scrollTop + 1);
        window.scroll(0, document.documentElement.scrollTop - 1);
      }
    }
  };
})();

export default lazy;
