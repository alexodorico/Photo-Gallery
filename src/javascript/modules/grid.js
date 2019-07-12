import options from '../../../gallery.config';

const grid = (_=> {

  function addAspectRatios(photoRow, update) {
    let aspectRatio = 0;

    photoRow.forEach(photo => {
      aspectRatio += photo.aspect_ratio;
    });
  
    return aspectRatio;
  }

  function computeSpaceInRow(photoRow) {
    let availableSpace = options.containerWidth - options.containerPadding - options.photoMargin * options.rowLength;

    if (photoRow.length !== options.rowLength) {
      availableSpace += (options.rowLength - photoRow.length) * options.photoMargin;
    }
  
    return availableSpace;
  }

  return {
    groupPhotos: function(data) {
      let photoGrid = new Array();
  
      try {
        for (let i = 0; i < data.length / options.rowLength; i++) {
          const photoRow = data.slice(options.rowLength * i, options.rowLength * i + options.rowLength);
          photoGrid.push(photoRow);
        }

        return photoGrid;
      } catch {
        return;
      }
    },

    calculatePhotoHeight: function(row) {
      const aspectRatio = addAspectRatios(row);
      const spaceInRow = computeSpaceInRow(row);
      const photoHeight = spaceInRow / aspectRatio;
      return photoHeight;
    }
  }
})();

export default grid;
