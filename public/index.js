$(function() {
	var API_BASE = 'https://morleynet.morleycms.com/components/handlers/DamApiHandler.ashx?request=';
	var offset = Math.floor(Math.random() * 4000).toString();
	var API_QUERY = 'assets/search?query_category=Morley+Asset%2FPhotography&limit=30&offset=' + offset;
	var ApiCall = API_BASE + API_QUERY;
	var selectedButtonText = 'Selected <span class="glyphicon glyphicon-ok-circle"></span>';
	var unselectedButtonText = 'Select <span class="glyphicon glyphicon-plus-sign"></span>';
	var selectedPhotoElement = [];
	var previousView
	var viewingSelected = false;

	generateImages(ApiCall);

	$('#view-selected-button').click(function() {
		var btnText = this.innerText;
		viewingSelected = !viewingSelected;
		btnText === "View Selected" ? btnText = "View All" : btnText = "View Selected";

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

	function generateImages(ApiCall) {
		$.get(ApiCall, function(data) {
			var initialContent = '';

			for (var i = 0; i < data.items.length; i++) {
				initialContent += `
				<div class="item" id="${data.items[i].id}" downloadLink="${data.items[i]._links.download}">
					<img class="lazy" src="https://via.placeholder.com/300x200" data-src="https://via.placeholder.com/300x200x90.png?text=Lazy+Load+Successful"></img>
					<div class="overlay">
						<h1>Title</h1>
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
			}

			$('#photo-grid').append(initialContent);
			lazyLoadSetUp();
			$('.select-button').on('click', handleSelectButtonClick);
			$('.download-button').on('click', handleSingleDownloadClick);
		});
	}

	function lazyLoadSetUp() {
		var lazyImages = [].slice.call(document.querySelectorAll("img.lazy"));

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
			// fallback for browsers that don't support Interaction Observer
		}
	}

	function handleSingleDownloadClick() {
		var $this = $(this);
		var downloadLink = $this.parents('.item').attr('downloadLink');
		$('iframe').attr("src", downloadLink);
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
	let $categoryItems = document.getElementsByClassName('category-item');
	let $selectedCategoriesList = document.getElementById('selected-categories');

	for (let element of $categoryItems) {
		element.addEventListener("click", function(event) {
			addCategoryToView(event);
		});
	}

	function addCategoryToView(event) {
		let alreadySelected = checkIfSelected(event);
		if (alreadySelected) return;
		let categoryName = event.target.innerText;
		let categoryElement = createCategoryElement(categoryName);
		$selectedCategoriesList.append(categoryElement);
		let $selectedCategoryItems = document.getElementsByClassName('selected-category-item');
		addEventListener($selectedCategoryItems);
	}

	function removeCategoryFromView(event) {
		let categoryName = event.target.innerText;
		for (let element of $categoryItems) {
			if (element.innerText == categoryName) element.dataset.selected = false;
		}
		event.target.remove();
	}

	function checkIfSelected(event) {
		let dataset = event.target.parentElement.dataset;
		if (dataset.selected === "false") {
			dataset.selected = "true";
			return false;
		} else {
			return true;
		}
	}

	function createCategoryElement(categoryName) {
		let categoryElement = document.createElement('li');
		categoryElement.innerHTML = categoryName;
		categoryElement.className = "selected-category-item";
		return categoryElement;
	}

	function addEventListener($elements) {
		for (let element of $elements) {
			element.addEventListener("click", function(event) {
				removeCategoryFromView(event);
			});
		}
	}
});