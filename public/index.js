$(function() {
	var API_BASE = 'https://morleynet.morleycms.com/components/handlers/DamApiHandler.ashx?request=';
	var API_QUERY = 'assets/search?query=jn%3AGT0000&expand=asset_properties%2Cfile_properties%2Cembeds%2Cthumbnails%2Cmetadata%2Cmetadata_info&limit=50';
	var ApiCall = API_BASE + API_QUERY;

	var selectedButtonText = 'Selected <span class="glyphicon glyphicon-ok-circle"></span>';
	var unselectedButtonText = 'Select <span class="glyphicon glyphicon-plus-sign"></span>';

	var selectedPhotoElement = [];

	var viewingSelected = false;
	var viewingAll = true;
	var selectedCategory = '';

	var containerWidth = 900;
	var photosInRow = 3;
	var photoMargin = 10; // 5 pixels on the left AND right of each photo
	var containerPadding = 28; // 14 pixels on the left AND right of each photo

	var categoryData = {};
	var categories = [];

	init(ApiCall);

	function init(ApiCall) {
		$.get(ApiCall, function(data) {
			var initialContent = '';

			categories = getCategories(data.items);
			buildPhotoCategoryObject(categories);
			addDataToCategory(data.items);
			populateCategoriesDropDown(categories);
			$('.category-item').on('click', addCategoryToView);
			$('#view-selected-button').on('click', handleViewSelectedClick);

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
			$('img').on('click', lightboxInit);
			$('.select-button').on('click', handleSelectButtonClick);
			$('.download-button').on('click', handleSingleDownloadClick);
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

	function addDataToCategory(photos) {
		for (var i = 0; i < photos.length; i++) {
			var category = photos[i].metadata.fields.gallery[0];
			categoryData[category].data.push(photos[i]);
		}
	}

	function populateCategoriesDropDown(categories) {
		var categoryMenu = $('.category-dd-menu');

		categories.forEach(function(category) {
			categoryMenu.append(`<li class="category-item" data-selected="false" data-category="${category}"><a href="#">${category}</a></li>`)
		});
	}

	function addCategoryToView(event) {
		var categoryName = event.target.innerText;

		$('.selected-category-item').detach();
		$('#selected-categories').append(`<li class="selected-category-item">${categoryName}</li>`);

		if (viewingAll) {
			for (var category of categories) {
				storeCategory(category);
			}

			if (categoryName === 'All') {
				viewAll();
			} else {
				viewCategory(categoryName);
				viewingAll = false;
			}
			
			selectedCategory = categoryName;
		} else if (viewingSelected) {
			$('.item').detach();
			
			if (categoryName === 'All') {
				viewAll();
			} else {
				viewCategory(categoryName);
				selectedCategory = categoryName;
			}

			viewingSelected = false;
		} else {
			storeCategory(selectedCategory);

			if (categoryName === 'All') {
				viewAll();
			} else {
				viewCategory(categoryName);
			}

			selectedCategory = categoryName;
		}
	}

	function storeCategory(category) {
		categoryData[category].markup = $(`.item[data-category="${category}"]`).detach();
	}

	function viewCategory(categoryName) {
		$('#photo-grid').append(categoryData[categoryName].markup);
	}

	function viewAll() {
		for (var categoryName in categoryData) {
			viewCategory(categoryName);
		}

		viewingAll = true;
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

	// TODO: 
	//		 Remove photo when unselected in view selected
	//		 Add thumbnails	
	function lightboxInit(e) {
		var pswpElement = document.querySelectorAll('.pswp')[0];
		var lightboxPhotos = [];
		var $items = $('.item');
		var element = e.target.parentElement;
		var i = 0;
		var options = {
			index: 0
		};

		while (element.previousElementSibling != null) {
			element = element.previousElementSibling;
			i++;
		}

		options.index = i;

		for (var i = 0; i < $items.length; i++) {
			var item = {};
			item.src = $items[i].children[1].dataset['originalSrc'];
			item.w = $items[i].children[1].dataset['originalWidth'];
			item.h = $items[i].children[1].dataset['originalHeight'];
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

	function selectPhoto($this) {
		var photoMarkup = $this.parents('.item').clone(true);
		selectedPhotoElement.push(photoMarkup);
		updateCount();
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
			updateState(photoElement);
			photoElement.fadeOut(function() {
				recalculatePhotoDimensions();
			});
		}

		updateCount();
	}

	function updateCount() {
		var count = selectedPhotoElement.length;
		$('.badge').text(count);
	}

	// classList isn't IE9 compatible, change later...
	function updateState(photoElement) {
		var id = photoElement[0].id;
		var category = photoElement[0].dataset.category;

		for (var element of categoryData[category].markup) {
			if (element.id === id) {
				var button = element.lastElementChild.lastElementChild.firstElementChild;
				button.classList.remove('btn-success');
				button.classList.add('btn-default');
				button.innerHTML = unselectedButtonText;
			}
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

	function handleViewSelectedClick() {
		if (viewingSelected) return;

		if (viewingAll) {
			for (var category of categories) {
				storeCategory(category);
			}
			viewingAll = false;
		} else {
			storeCategory(selectedCategory);
		}

		viewSelected();
		viewingSelected = true;
	}

	function viewSelected() {
		recalculatePhotoDimensions();
		selectedPhotoElement.forEach(function(element) {
			element.appendTo('#photo-grid');
		});
	}

	function handleSingleDownloadClick() {
		var downloadLink = $(this).parents('.item').attr('downloadLink');
		$('iframe').attr("src", downloadLink);
	}
});