$(function() {
	var API_BASE = 'https://morleynet.morleycms.com/components/handlers/DamApiHandler.ashx?request=';
	var offset = Math.floor(Math.random() * 4000).toString();
	var API_QUERY = 'assets/search?query_category=Morley+Asset%2FPhotography&limit=6&offset=' + offset;
	var ApiCall = API_BASE + API_QUERY;
	var selectedButtonText = 'Selected <span class="glyphicon glyphicon-ok-circle"></span>';
	var unselectedButtonText = 'Select <span class="glyphicon glyphicon-plus-sign"></span>';
	var selectedPhotoLinks = [];
	var selectedPhotoElement = [];
	var previousView
	var viewingSelected = false;

	generateImages(ApiCall);

	$('#view-selected-button').click(function() {
		if (this.innerText === "View Selected") {
			viewingSelected = true;
			this.innerText = "View All";
			previousView = $('.item').detach();
			selectedPhotoElement.forEach(function(element) {
				element.appendTo('#photo-grid');
			});
		} else {
			viewingSelected = false;
			this.innerText = "View Selected";
			$('.item').detach();
			previousView.appendTo('#photo-grid');
		}
	});

	function generateImages(ApiCall) {
		$.get(ApiCall, function(data) {
			photoData = data;
			var initialContent = '';

			for (var i = 0; i < data.items.length; i++) {
				initialContent += `
				<div class="item" id="${data.items[i].id}" downloadLink="${data.items[i]._links.download}">
					<img src="https://via.placeholder.com/300x200"></img>
					<div class="overlay">
						<h1>Title</h1>
						<div class="photo-controls">
							<button type="button" class="btn btn-default select-button">
								${unselectedButtonText}
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

	function handleSingleDownloadClick() {
		var downloadLink = this.dataset.link;
		$('iframe').attr("src", downloadLink);
	}

	function handleSelectButtonClick() {
		$(this).toggleClass('btn-default btn-success');
		if ($(this).hasClass('btn-success')) {
			$(this).html(selectedButtonText);
			selectPhoto($(this));
		} else {
			$(this).html(unselectedButtonText);
			deselectPhoto($(this));
		}
	}

	function selectPhoto($this) {
		var downloadLink = $this.parent().parent().parent().attr('downloadLink');
		var photoMarkup = $this.parent().parent().parent().clone(true);
		selectedPhotoLinks.push(downloadLink);
		selectedPhotoElement.push(photoMarkup);
	}

	function deselectPhoto($this) {
		var downloadLink = $this.parent().parent().parent().attr('downloadLink');
		var downloadLinkIndex = selectedPhotoLinks.indexOf(downloadLink);
		var photoElement = $this.parent().parent().parent();
		var photoElementIndex;

		for (var i = 0; i < selectedPhotoElement.length; i++) {
			if (selectedPhotoElement[i][0].id === photoElement[0].id) {
				photoElementIndex = selectedPhotoElement.indexOf(selectedPhotoElement[i]);
			}
		}

		if (viewingSelected) {
			updatePreviousView(photoElement);
			$this.parent().parent().parent().fadeOut();
		}

		selectedPhotoLinks.splice(downloadLinkIndex, 1);
		selectedPhotoElement.splice(photoElementIndex, 1);
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