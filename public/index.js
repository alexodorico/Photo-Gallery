$(function() {
	var API_BASE = 'https://morleynet.morleycms.com/components/handlers/DamApiHandler.ashx?request=';
	var API_QUERY = 'assets/search?query=jn%3AGT0000&expand=asset_properties%2Cfile_properties%2Cembeds%2Cthumbnails%2Cmetadata%2Cmetadata_info&limit=50';
	var ApiCall = API_BASE + API_QUERY;
	var selectedButtonText = 'Selected <span class="glyphicon glyphicon-ok-circle"></span>';
	var unselectedButtonText = 'Select <span class="glyphicon glyphicon-plus-sign"></span>';
	var selectedPhotoElement = [];
	var previousView;

	var viewingSelected = false;
	var viewingAll = true;
	var selectedCategory = '';

	var containerWidth = 900;
	var photosInRow = 3;
	var photoMargin = 10; // 5 pixels on the left AND right of each photo
	var containerPadding = 28 // 14 pixels on the left AND right of each photo
	var categoryData = {};
	var categories = [];

	init(ApiCall);

	function init(ApiCall) {
		$.get(ApiCall, function(data) {
			var initialContent = '';

			categories = getCategories(data.items);
			buildPhotoCategoryObject(categories);
			addDataToCategory(data.items);

			for (var category in categoryData) {
				var categoryGrid = groupPhotos(categoryData[category].data);

				for (var row of categoryGrid) {
					var ar = addAspectRatios(row);
					var availableSpace = computeSpaceInRow(row);
					var photoHeight = computeRowHeight(ar, availableSpace);
					categoryData[category].markup += buildMarkup(row, photoHeight);
				}

				initialContent += categoryData[category].markup;
			}
			
			$('#photo-grid').append(initialContent);
			lazyLoadSetUp();
			populateCategories(categories);
			$('.category-item').on('click', addCategoryToView);
			$('img').on('click', lightboxInit);
			$('.select-button').on('click', handleSelectButtonClick);
			$('.download-button').on('click', handleSingleDownloadClick);
			$('#view-selected-button').on('click', handleViewSelectedClick);
		});
	}

	function getCategories(photos) {
		var categories = [];

		photos.forEach(function(photo) {
			if (categories.indexOf(photo.metadata.fields.gallery[0]) === -1) {
				categories.push(photo.metadata.fields.gallery[0]);
			}
		});

		return categories;
	}

	function buildPhotoCategoryObject(categories) {
		categories.forEach(function(category) {
			categoryData[category] = new Category();
		});
	}

	function Category() {
		this.data = [];
		this.markup = '';
	}

	function populateCategories(categories) {
		var categoryMenu = $('.dropdown-menu');

		categories.forEach(function(category) {
			categoryMenu.append(`<li class="category-item" data-selected="false" data-category="${category}"><a href="#">${category}</a></li>`)
		});
	}

	function addDataToCategory(photos) {
		for (var i = 0; i < photos.length; i++) {
			var category = photos[i].metadata.fields.gallery[0];
			categoryData[category].data.push(photos[i]);
		}
	}

	// Creates two dimensional array
	function groupPhotos(images) {
		var photoGrid = [];

		for (var i = 0; i < images.length / photosInRow; i++) {
			var photoRow = images.slice(photosInRow * i, photosInRow * i + photosInRow);
			photoGrid.push(photoRow);
		}

		return photoGrid;
	}

	// On initial load, aspect ratio is calculated from API response
	// When this gets called after initial load (uwitching views/removing photos) 
	// aspect ratio must be calculated by accessing element object
	function addAspectRatios(photoRow, update) {
		var ar = 0;

		for (var i = 0; i < photoRow.length; i++) {
			ar += update ? parseFloat(photoRow[i][0].children[1].dataset.ar) : photoRow[i].file_properties.image_properties.aspect_ratio;
		}

		return ar;
	}

	function computeSpaceInRow(photoRow) {
		var availableSpace = containerWidth - containerPadding - photoMargin * photosInRow;

		if (photoRow.length !== photosInRow) {
			availableSpace += (photosInRow - photoRow.length) * photoMargin;
		}

		return availableSpace;
	}

	function computeRowHeight(ar, availableSpace) {
		return availableSpace / ar;
	}

	function buildMarkup(photoRow, photoHeight) {
		var initialContent = '';

		photoRow.forEach(function(photo) {
			initialContent += `
			<div class="item"
				 data-category="${photo.metadata.fields.gallery[0]}"
				 id="${photo.id}"
				 downloadLink="${photo._links.download}">
				<div class="loader"></div>
				<img
					class="lazy"
					data-ar="${photo.file_properties.image_properties.aspect_ratio}"
					data-original-src="${photo.embeds['AssetOriginalWidth/Height'].url}"
					data-original-height="${photo.file_properties.image_properties.height}"
					data-original-width="${photo.file_properties.image_properties.width}"
					height="${photoHeight}"
					width="${photo.file_properties.image_properties.aspect_ratio * photoHeight}"
					src=""
					data-src="${photo.thumbnails['600px'].url}">
				</img>
				<div class="overlay">
					<div class="photo-controls">
						<button type="button" class="btn btn-default select-button">
							${unselectedButtonText}
						</button>
						<button class="btn btn-default download-button">
							<span class="glyphicon glyphicon-download-alt"></span>
						</button>
					</div>
				</div>
			</div>`
		});

		return initialContent;
	}

	function lazyLoadSetUp() {
		var lazyImages = [].slice.call(document.querySelectorAll("img.lazy"));
		var active = false;

		if ('IntersectionObserver' in window) {
			var lazyImageObserver = new IntersectionObserver(function(entries, observer) {
				entries.forEach(function(entry) {
					if (entry.isIntersecting) {
						var lazyImage = entry.target;
						lazyImage.src = lazyImage.dataset.src;
						lazyImage.classList.remove('lazy');
						lazyImageObserver.unobserve(lazyImage);
					}
				});
			});

			lazyImages.forEach(function(lazyImage) {
				lazyImageObserver.observe(lazyImage);
			});
		} else {
			var lazyLoad = function() {
				if (active === false) {
					active = true;

					setTimeout(function() {
						lazyImages.forEach(function(lazyImage) {
							if ((lazyImage.getBoundingClientRect().top <= window.innerHeight && lazyImage.getBoundingClientRect().bottom >= 0) && getComputedStyle(lazyImage).display !== "none") {
								lazyImage.src = lazyImage.dataset.src;
								lazyImage.classList.remove('lazy');

								lazyImages = lazyImages.filter(function(image) {
									return image !== lazyImage;
								});

								if (lazyImage.length === 0) {
									document.removeEventListener('scroll', lazyLoad);
									window.removeEventListener('resize', lazyLoad);
									window.removeEventListener('orientationchange', lazyLoad);
								}
							}
						});

						active = false;
					}, 200);
				}
			};

			document.addEventListener('scroll', lazyLoad);
			window.addEventListener('resize', lazyLoad);
			window.addEventListener('orientationchange', lazyLoad);
		}
	}

	// TODO: Get index of clicked photo and pass to options object
	// 		 Lazy-Loading
	//		 Remove photo when unselected in view selected
	//		 Add thumbnails
	//		 Get h/w for full-size image		
	function lightboxInit() {
		var pswpElement = document.querySelectorAll('.pswp')[0];
		var lightboxPhotos = [];
		var $items = $('.item');
		var options = {
			index: 0
		};

		for (var i = 0; i < $items.length; i++) {
			var item = {};
			item.src = $items[i].children[1].attributes.src.value;
			item.w = $items[i].clientWidth;
			item.h = $items[i].clientHeight;
			lightboxPhotos.push(item);
		}
	
		var gallery = new PhotoSwipe( pswpElement, PhotoSwipeUI_Default, lightboxPhotos, options);
		gallery.init();
	}

	function handleSelectButtonClick() {
		var $this = $(this);
		$this.toggleClass('btn-default btn-success');
		if ($this.hasClass('btn-success')) {
			$this.html(selectedButtonText);
			selectPhoto($this);
		} else {
			$this.html(unselectedButtonText);
			deselectPhoto($this);
		}
	}

	function handleSingleDownloadClick() {
		var $this = $(this);
		var downloadLink = $this.parents('.item').attr('downloadLink');
		$('iframe').attr("src", downloadLink);
	}

	function selectPhoto($this) {
		var photoMarkup = $this.parents('.item').clone(true);
		selectedPhotoElement.push(photoMarkup);
	}

	function deselectPhoto($this) {
		var photoElement = $this.parents('.item');
		var photoElementIndex;

		for (var i = 0; i < selectedPhotoElement.length; i++) {
			if (selectedPhotoElement[i][0].id === photoElement[0].id) {
				photoElementIndex = selectedPhotoElement.indexOf(selectedPhotoElement[i]);
			}
		}

		selectedPhotoElement.splice(photoElementIndex, 1);

		if (viewingSelected) {
			updatePreviousView(photoElement);
			photoElement.fadeOut(function() {
				recalculatePhotoDimensions();
			});
		}
	}

	// classList isn't IE9 compatible, change later...
	function updatePreviousView(photoElement) {
		console.log(previousView);
		for (var element in previousView) {
			if (previousView[element].id === photoElement[0].id) {
				var previousViewItem = previousView[element].lastElementChild.lastElementChild.firstElementChild;
				previousViewItem.classList.remove('btn-success');
				previousViewItem.classList.add('btn-default');
				previousViewItem.innerHTML = unselectedButtonText;
			}
		}
	}

	function handleViewSelectedClick() {
		viewingSelected = !viewingSelected;
		this.innerText == "View Selected" ? this.innerText = "View All" : this.innerText = "View Selected";

		if (viewingSelected) {
			previousView = $('.item').detach();
			recalculatePhotoDimensions();
			selectedPhotoElement.forEach(function(element) {
				element.appendTo('#photo-grid');
			});
		} else {
			$('.item').detach();
			previousView.appendTo('#photo-grid');
		}
	}

	function recalculatePhotoDimensions() {
		var photoGrid = groupPhotos(selectedPhotoElement);

		photoGrid.forEach(function(photoRow) {
			var ar = addAspectRatios(photoRow, true);
			var availableSpace = computeSpaceInRow(photoRow);
			var photoHeight = computeRowHeight(ar, availableSpace);

			alterImageDimensions(photoRow, photoHeight);
		});
	}

	function alterImageDimensions(photoRow, photoHeight) {
		for (var i = 0; i < photoRow.length; i++) {
			var ar = photoRow[i][0].children[1].attributes["data-ar"].value;
			photoRow[i][0].children[1].setAttribute("height", photoHeight);
			photoRow[i][0].children[1].setAttribute("width", photoHeight * ar);
		}
	}

	////////////////////////////////////////////////
	// HANDLES ADDING/REMOVING CATEGORIES TO VIEW //
	////////////////////////////////////////////////
	var $categoryItems = document.getElementsByClassName('category-item');
	var $selectedCategoriesList = document.getElementById('selected-categories');

	function addCategoryToView(event) {
		var categoryName = event.target.innerText;
		var categoryElement = createCategoryElement(categoryName);
		var $selectedCategoryItems = document.getElementsByClassName('selected-category-item');

		if (checkIfSelected(event)) return;

		$selectedCategoriesList.append(categoryElement);

		for (var element of $selectedCategoryItems) {
			element.addEventListener("click", removeCategoryFromView);
		}

		if (viewingAll && !viewingSelected) {
			var categoriesToStore = categories.filter(function(category) {
				return category !== categoryName;
			});

			for (var category of categoriesToStore) {
				categoryData[category].markup = $(`.item[data-category="${category}"]`).detach();
			}

			selectedCategory = categoryName;
			viewingAll = false;

		} else {
			categoryData[selectedCategory].markup = $(`.item[data-category="${selectedCategory}"]`).detach();
			$('#photo-grid').append(categoryData[categoryName].markup);

			selectedCategory = categoryName;
		}
	}

	function checkIfSelected(event) {
		var dataset = event.target.parentElement.dataset;
		if (dataset.selected === "false") {
			dataset.selected = "true";
			return false;
		} else {
			return true;
		}
	}

	function createCategoryElement(categoryName) {
		var categoryElement = document.createElement('li');
		categoryElement.innerHTML = categoryName;
		categoryElement.className = "selected-category-item";
		return categoryElement;
	}

	function removeCategoryFromView(event) {
		var categoryName = event.target.innerText;
		for (var element of $categoryItems) {
			if (element.innerText == categoryName) element.dataset.selected = false;
		}
		event.target.remove();
	}
});