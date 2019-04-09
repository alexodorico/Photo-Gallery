$(function() {
	////////////////////////////////////////////////
	// Fetch Photos from DAM API for initial view //
	////////////////////////////////////////////////
	var API_BASE = 'https://morleynet.morleycms.com/components/handlers/DamApiHandler.ashx?request=';
	var offset = Math.floor(Math.random() * 4000).toString();
	var API_QUERY = 'assets/search?query_category=Morley+Asset%2FPhotography&limit=30&offset=' + offset;
	var ApiCall = API_BASE + API_QUERY;

	var selectedButtonText = 'Selected <span class="glyphicon glyphicon-ok-circle"></span>';
	var unselectedButtonText = 'Select <span class="glyphicon glyphicon-plus-sign"></span>';
	var removeButtonText = 'Remove <span class="glyphicon glyphicon-minus-sign"></span>';

	var selectedPhotoLinks = [];
	var selectedPhotoElement = [];
	var previousView = [];

	var viewingSelected = false;

	generateImages(ApiCall);

	function generateImages(ApiCall) {
		$.get(ApiCall, function(data) {
			var initialContent = '';

			for (var i = 0; i < data.items.length; i++) {
				// switch to regular quotes when ready for production
				initialContent += `
				<div class="item" id="${data.items[i].id}" downloadLink="${data.items[i]._links.download}">
					<img src="https://via.placeholder.com/300x200"></img>
					<div class="overlay">
						<h1>Title</h1>
						<div class="photo-controls">
							<button type="button" class="btn btn-default select-button">
								Select <span class="glyphicon glyphicon-plus-sign"></span>
							</button>
							<button data-link="${data.items[i]._links.download}" class="btn btn-default download-button">
								<span class="glyphicon glyphicon-download-alt"></span>
							</button>
						</div>
					</div>
				</div>`
			}

			$('#photo-grid').append(initialContent);
			$('.select-button').on('click', handleSelectButtonClick);
			$('.download-button').on('click', handleSingleDownloadClick);
		});
	}

	function handleSelectButtonClick() {
		if (Modernizr.touch) {
			if ($(this).hasClass('btn-default')) {
				$this = $(this);
				toggleClasses($this, 'btn-default', 'btn-success', selectedButtonText);
				selectPhoto($this);
			} else {
				$this = $(this);
				toggleClasses($this, 'btn-success', 'btn-default', unselectedButtonText);
				deselectPhoto($this);
			}
		} else {
			// Initial view, and after a photo has been deselected
			if ($(this).hasClass('btn-default')) {
				var $this = $(this);
				toggleClasses($this, 'btn-default', 'btn-success', selectedButtonText);
				selectPhoto($this);
			}

			// If photo been has been selected...
			if ($(this).hasClass('btn-success')) {
				// ...on mouseover notify user that they can deselect it
				$(this).mouseover(function () {
					var $this = $(this);
					toggleClasses($this, 'btn-success', 'btn-danger', removeButtonText);
				});
				 // ...and on mouseleave go back to initial selected view
				$(this).mouseleave(function() {
					if (!$(this).hasClass('btn-default')) {
						var $this = $(this);
						toggleClasses($this, 'btn-danger', 'btn-success', selectedButtonText);
					}
				});
			}
			
			// Has this class when selected AND hovered over
			if ($(this).hasClass('btn-danger')) {
				var $this = $(this);
				deselectPhoto($this);
				$(this)
					.off('mouseover')
					.removeClass('btn-danger')
					.addClass('btn-default')
					.html(unselectedButtonText);
			}
		}
	}

	function handleSingleDownloadClick() {
		var downloadLink = this.dataset.link;
		$('iframe').attr("src", downloadLink);
	}

	function toggleClasses($this, initialClass, newClass, html) {
		$this
			.removeClass(initialClass)
			.addClass(newClass)
			.html(html);
	}

	function reapplyHoverListeners() {
		$('.btn-success').mouseover(function () {
			toggleClasses($(this), 'btn-success', 'btn-danger', removeButtonText);
		});
		$('.btn-success').mouseleave(function() {
			if (!$(this).hasClass('btn-default')) {
				toggleClasses($(this), 'btn-danger', 'btn-success', selectedButtonText);
			}
		});
	}

	function selectPhoto($this) {
		var downloadLink = $this.parent().parent().parent().attr('downloadLink');
		var photoMarkup = $this.parent().parent().parent()[0];
		selectedPhotoLinks.push(downloadLink);
		selectedPhotoElement.push(photoMarkup);
	}

	function deselectPhoto($this) {
		var downloadLink = $this.parent().parent().parent().attr('downloadLink');
		var downloadLinkIndex = selectedPhotoLinks.indexOf(downloadLink);
		var photoElement = $this.parent().parent().parent()[0];
		var photoElementIndex = selectedPhotoElement.indexOf(photoElement);

		if (viewingSelected) {
			updatePreviousView(photoElement);
			$this.parent().parent().parent().fadeOut();
		}

		selectedPhotoLinks.splice(downloadLinkIndex, 1);
		selectedPhotoElement.splice(photoElementIndex, 1);
	}

	function updatePreviousView(photoElement) {
		for (var i = 0; i < previousView.length; i++) {
			if (photoElement.id === previousView[i].id) {
				previousView[i].lastElementChild.lastElementChild.firstElementChild.classList.remove('btn-success');
				previousView[i].lastElementChild.lastElementChild.firstElementChild.classList.add('btn-default');
				previousView[i].lastElementChild.lastElementChild.firstElementChild.innerHTML = unselectedButtonText;
			}
		}
	}

	$('#view-selected-button').click(function() {
		if (this.innerText === "View Selected") {
			viewingSelected = true;
			this.innerText = "View All";
			getPreviousView();
			$('#photo-grid')[0].innerHTML = generateMarkup(selectedPhotoElement);
		} else {
			viewingSelected = false;
			this.innerText = "View Selected";
			$('#photo-grid')[0].innerHTML = generateMarkup(previousView);
		}

		$('.select-button').on('click', handleSelectButtonClick);
		reapplyHoverListeners();
		$('.download-button').on('click', handleSingleDownloadClick);
	});

	function getPreviousView() {
		previousView = $('.item').get();
	}

	function generateMarkup(array) {
		var markup = '';

		array.forEach(function(element) {
			markup += element.outerHTML;
		});

		return markup;
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