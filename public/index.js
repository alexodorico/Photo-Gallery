$('head').append('<script src="https://cdn.jsdelivr.net/npm/symbol-es6/dist/symbol-es6.min.js"></script>');

$(function() {
	var API_BASE = 'https://morleygrouptravel-stg.morleycms.com/widgets/photoGalleryv3/getCategory.ashx?';
	var selectedButtonText = 'Selected <span class="glyphicon glyphicon-ok-circle"></span>';
	var unselectedButtonText = 'Select <span class="glyphicon glyphicon-plus-sign"></span>';
	var selectedPhotoElement = [];
	var viewingSelected = false;
	var selectedCategory = '';
	var containerWidth = 900;
	var photosInRow = 3;
	var photoMargin = 10; // 5 pixels on the left AND right of each photo
	var containerPadding = 28; // 14 pixels on the left AND right of each photo
	var photoLimit = 24; // How many photos get loaded per API call
	var categoryData = {};
	var categories = window.categories || [ "gala", "fireworks", "team-building event", "gm topiary", "soy awards" ];
	var jobNumber = window.jobNumber || "GT0000";
	
	init();

	function init() {
		objectFitImages();
		$('#view-selected-button').css('opacity', '0');
		buildPhotoCategoryObject(categories);
		populateCategoriesDropDown(categories);
		selectedCategory = categoryData[categories[0]].name;
		$('.selected-category-item').text(categoryData[categories[0]].displayName());
		$('.category-item').on('click', addCategoryToView);
		$('#view-selected-button').on('click', handleViewSelectedClick);
		$('#download-zip').on('click', handleBatchDownload);
		getData(buildAPICall(categoryData[categories[0]].apiName(), photoLimit, 0));
		$('.pswp__button--arrow--right').on('click', function(e){e.preventDefault();});
		$('.pswp__button--arrow--left').on('click', function(e){e.preventDefault();});
		$('.pswp__button--close').on('click', function(e){e.preventDefault();});
	}

	function buildPhotoCategoryObject(categories) {
		categories.forEach(function(category) {
			categoryData[category] = new Category(category);
		});
	}

	function Category(category) {
		this.name = category;
		this.displayName = function() {
			return this.name.split(' ').map(function(word) {return word[0].toUpperCase() + word.substr(1);}).join(' ');
		}
		this.apiName = function() {
			return this.name.replace(' ', '_');
		}
		this.markup = '';
		this.offset = 0;
		this.incrementOffset = function() {
			this.offset += photoLimit;
		}
	}

	function populateCategoriesDropDown(categories) {
		var categoryMenu = $('.category-dd-menu');

		categories.forEach(function(category) {
			var displayName = categoryData[category].displayName();
			categoryMenu.append(`<li class="category-item" data-selected="false" data-category="${category}"><a href="#">${displayName}</a></li>`)
		});
	}

	function buildAPICall(category, limit, offset) {
		return `${API_BASE}job=${jobNumber}&cat=${category}&limit=${limit.toString()}&offset=${offset.toString()}`; 
	}

	function getData(endpoint) {
		$.get(endpoint, function(data) {
			var content = '';
			var photos = data.items;
			var category = photos[0].metadata.fields.gallery[0].toLowerCase();
			categoryData[category].incrementOffset();
			var offset = categoryData[category].offset;
			var batch = offset / photoLimit;
			var categoryGrid = groupPhotos(photos);

			for (var row of categoryGrid) {
				var ar = addAspectRatios(row);
				var availableSpace = computeSpaceInRow(row);
				var photoHeight = computeRowHeight(ar, availableSpace);
				content += buildMarkup(category, row, photoHeight, batch);
				categoryData[category].markup += buildMarkup(category, row, photoHeight, batch);
			}			

			$('#photo-grid').append(content);
			lazyLoadSetUp();
			handleScroll(category, offset);
			$(`[data-batch="${batch}"] .select-button`).on('click', handleSelectButtonClick);
			$(`[data-batch="${batch}"] .download-button`).on('click', handleSingleDownloadClick);
			$(`[data-batch="${batch}"] img`).on('click', lightboxInit);
		});
	}

	function groupPhotos(images) {
		var photoGrid = [];
		for (var i = 0; i < images.length / photosInRow; i++) {
			var photoRow = images.slice(photosInRow * i, photosInRow * i + photosInRow);
			photoGrid.push(photoRow);
		}
		return photoGrid;
	}

	function addAspectRatios(photoRow, update) {
		var ar = 0;
		for (var i = 0; i < photoRow.length; i++) {
			ar += update ? parseFloat(photoRow[i][0].children[1].getAttribute('data-ar')) : photoRow[i].file_properties.image_properties.aspect_ratio;
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

	function buildMarkup(category, photoRow, photoHeight, batch) {
		var content = '';

		photoRow.forEach(function(photo) {
			content += `
			<div class="item"
				 data-category="${category}"
				 id="${photo.id}"
				 downloadLink="${photo.embeds['AssetOriginalWidth/Height'].url}"
				 ${!Modernizr.flexbox ? 'style="width:' + photo.file_properties.image_properties.aspect_ratio * photoHeight + 'px;"': ''}
				 data-batch="${batch}">
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

		return content;
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
								lazyImage.src = lazyImage.getAttribute('data-src');
								if (lazyImage.classList) {
									lazyImage.classList.remove('lazy');
								} else {
									lazyImage.className.replace(/\bblazy\b/g, "");
								}
								
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
			window.scroll(0,window.scrollY + 1);
			window.scroll(0,window.scrollY - 1);
		}
	}

	function handleScroll(category, offset) {
		$(window).scroll(function() {
			if($(window).scrollTop() >= $(document).height() - $(window).height() - 500) {
				$(window).off('scroll');
				getData(buildAPICall(categoryData[category].apiName(), photoLimit, offset));
			}
		});
	}

	function addCategoryToView(event) {
		var categoryName = event.target.parentElement.getAttribute('data-category');

		$('.selected-category-item').detach();
		$('#selected-categories').append(`<li class="selected-category-item">${categoryData[categoryName].displayName()}</li>`);

		if (viewingSelected) {
			$('.item').detach();
			viewCategory(categoryName);
			selectedCategory = categoryName;
			viewingSelected = false;
		} else {
			storeCategory(selectedCategory);
			viewCategory(categoryName);
			selectedCategory = categoryName;
		}
	}

	function storeCategory(category) {
		categoryData[category].markup = $(`.item[data-category="${category}"]`).detach();
		$(window).off('scroll');
	}

	function viewCategory(categoryName) {
		if (categoryData[categoryName].offset === 0) {
			getData(buildAPICall(categoryData[categoryName].apiName(), photoLimit, categoryData[categoryName].offset));
		} else {
			$('#photo-grid').append(categoryData[categoryName].markup);
			handleScroll(categoryName, categoryData[categoryName].offset);
		}
	}

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
			item.src = $items[i].children[1].getAttribute('data-original-src');
			item.w = $items[i].children[1].getAttribute('data-original-width');
			item.h = $items[i].children[1].getAttribute('data-original-height');
			lightboxPhotos.push(item);
		}
	
		var gallery = new PhotoSwipe(pswpElement, PhotoSwipeUI_Default, lightboxPhotos, options);
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
		if (count > 0) {
			$('#view-selected-button').animate({opacity: 1});
		} else {
			$('#view-selected-button').animate({opacity: 0});
		}
	}

	function updateState(photoElement) {
		var id = photoElement[0].id;
		var category = photoElement[0].getAttribute('data-category');

		if (!Object.entries) {
			Object.entries = function( obj ){
				var ownProps = Object.keys( obj ),
					i = ownProps.length,
					resArray = new Array(i);
				while (i--)
					resArray[i] = [ownProps[i], obj[ownProps[i]]];
	
				return resArray;
			};
		}

		for (var element of Object.entries(categoryData[category].markup)) {
			if (element[1].id === id) {
				var button = element[1].lastElementChild.lastElementChild.firstElementChild;
				if (button.classList) {
					button.classList.remove('btn-success');
					button.classList.add('btn-default');
				} else {
					button.className = button.className.replace(/\bbtn-success\b/g, "")
					button.className += " btn-default";
				}

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
		storeCategory(selectedCategory);
		viewSelected();
		$('.selected-category-item').detach();
		$('#selected-categories').append(`<li class="selected-category-item">Selected</li>`);
		viewingSelected = true;
	}

	function viewSelected() {
		recalculatePhotoDimensions();
		selectedPhotoElement.forEach(function(element) {
			element.appendTo('#photo-grid');
		});
	}

	function handleSingleDownloadClick(e) {
		e.preventDefault();
		var downloadLink = $(this).parents('.item').attr('downloadLink');
		$('iframe').attr("src", downloadLink);
	}

	function handleBatchDownload() {
		var downloadLinks = [];
		for (var element of selectedPhotoElement) {
			downloadLinks.push(element[0].attributes['downloadlink'].value)
		}
		createZip(downloadLinks, 'test');
	}
});