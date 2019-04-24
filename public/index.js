$(function() {
	var API_BASE = 'https://morleynet.morleycms.com/components/handlers/DamApiHandler.ashx?request=';
	var API_QUERY = 'assets/search?query=jn%3AGT0000&expand=asset_properties%2Cfile_properties%2Cembeds%2Cthumbnails%2Cmetadata%2Cmetadata_info&limit=21';
	var ApiCall = API_BASE + API_QUERY;
	var selectedButtonText = 'Selected <span class="glyphicon glyphicon-ok-circle"></span>';
	var unselectedButtonText = 'Select <span class="glyphicon glyphicon-plus-sign"></span>';
	var selectedPhotoElement = [];
	var previousView;
	var viewingSelected = false;
	var photosInRow = 3;
	var photoMargin = 10; // 5 pixels on the left AND right of each photo

	init(ApiCall);

	$('#view-selected-button').click(function() {
		viewingSelected = !viewingSelected;
		this.innerText == "View Selected" ? this.innerText = "View All" : this.innerText = "View Selected";

		if (viewingSelected) {
			previousView = $('.item').detach();
			
			selectedPhotoElement.forEach(function(element) {
				element.appendTo('#photo-grid');
			});
		} else {
			$('.item').detach();
			previousView.appendTo('#photo-grid');
		}
	});

	function init(ApiCall) {
		$.get(ApiCall, function(data) {
			var initialContent = '';
			var photoGrid = groupPhotos(data.items);

			for (var row of photoGrid) {
				var ar = addAspectRatios(row);
				var availableSpace = computeSpaceInRow(row);
				var photoHeight = computeRowHeight(ar, availableSpace);
				initialContent += buildInitialMarkup(row, photoHeight);
			}

			$('#photo-grid').append(initialContent);
			lazyLoadSetUp();
			$('img').on('click', lightboxInit);
			$('.select-button').on('click', handleSelectButtonClick);
			$('.download-button').on('click', handleSingleDownloadClick);
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

	function addAspectRatios(photoRow) {
		var ar = 0;

		photoRow.forEach(function(photo) {
			ar += photo.file_properties.image_properties.aspect_ratio;
		});

		return ar;
	}

	function computeSpaceInRow(photoRow) {
		var availableSpace = 842;

		if (photoRow.length !== photosInRow) {
			availableSpace += (photosInRow - photoRow.length) * photoMargin;
		}

		return availableSpace;
	}

	function computeRowHeight(ar, availableSpace) {
		return availableSpace / ar;
	}

	function buildInitialMarkup(photoRow, photoHeight) {
		var initialContent = '';

		photoRow.forEach(function(photo) {
			initialContent += `
			<div class="item" id="${photo.id}" downloadLink="${photo._links.download}">
				<div class="loader"></div>
				<img class="lazy" data-ar="${photo.file_properties.image_properties.aspect_ratio}" data-category="${photo.metadata.fields.gallery[0]}" height="${photoHeight}" width="${photo.file_properties.image_properties.aspect_ratio * photoHeight}" src="" data-src="${photo.thumbnails['600px'].url}"></img>
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
		console.log(this);
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
			photoElement.fadeOut();
		}
	}

	// classList isn't IE9 compatible, change later...
	function updatePreviousView(photoElement) {
		for (var element in previousView) {
			if (previousView[element].id === photoElement[0].id) {
				var previousViewItem = previousView[element].lastElementChild.lastElementChild.firstElementChild;
				previousViewItem.classList.remove('btn-success');
				previousViewItem.classList.add('btn-default');
				previousViewItem.innerHTML = unselectedButtonText;
			}
		}
	}

	////////////////////////////////////////////////
	// HANDLES ADDING/REMOVING CATEGORIES TO VIEW //
	////////////////////////////////////////////////
	var $categoryItems = document.getElementsByClassName('category-item');
	var $selectedCategoriesList = document.getElementById('selected-categories');

	for (var element of $categoryItems) {
		element.addEventListener("click", function(event) {
			addCategoryToView(event);
		});
	}

	function addCategoryToView(event) {
		var alreadySelected = checkIfSelected(event);
		if (alreadySelected) return;
		var categoryName = event.target.innerText;
		var categoryElement = createCategoryElement(categoryName);
		$selectedCategoriesList.append(categoryElement);
		var $selectedCategoryItems = document.getElementsByClassName('selected-category-item');
		addEventListener($selectedCategoryItems);
	}

	function removeCategoryFromView(event) {
		var categoryName = event.target.innerText;
		for (var element of $categoryItems) {
			if (element.innerText == categoryName) element.dataset.selected = false;
		}
		event.target.remove();
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

	function addEventListener($elements) {
		for (var element of $elements) {
			element.addEventListener("click", removeCategoryFromView);
		}
	}
});