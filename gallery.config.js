const options = {

  // Base for API calls
  endpoint: "https://morleygrouptravel-stg.morleycms.com/widgets/photoGalleryv3/getCategory.ashx?",

  // Need to fix this later add get width using js, then fall back to 900
  containerWidth: 900,

  // How many photos in a row
  rowLength: 3,

  // Sum of photo margin left and margin right
  photoMargin: 10,

  // Sum of container padding left and padding right
  containerPadding: 28,
  
  // Photos per API call
  photoLimit: 24

}

export default options;