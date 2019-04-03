$(function() {
	////////////////////////////////////////////////
	// Fetch Photos from DAM API for initial view //
	////////////////////////////////////////////////
	var API_BASE = 'https://morleynet.morleycms.com/components/handlers/DamApiHandler.ashx?request=';
	var offset = Math.floor(Math.random() * 4000).toString();
	var API_QUERY = 'assets/search?query_category=Morley+Asset%2FPhotography&limit=30&offset=' + offset;
	var ApiCall = API_BASE + API_QUERY;
	var selectedPhotoLinks = [];
	var selectedPhotoMarkup = '';

	generateImages(ApiCall);

	var viewingSelected = true;
	$('#view-selected-button').click(function() {
		generateSelectedPhotoMarkup();
		// View Selected Photos
		// Change button text to view all
	})

	function generateSelectedPhotoMarkup() {
		// use data in selectedPhotoLinks array
		// use markup in generateImages()
	}

	function generateImages(ApiCall) {
		$.get(ApiCall, function(data) {
			var content = '';

			for (var i = 0; i < data.items.length; i++) {
				// switch to regular quotes when ready for production
				content += `
				<div class="item" id="${data.items[i].id}" downloadLink="${data.items[i]._links.download}">
					<img src="https://via.placeholder.com/300x200"></img>
					<div class="overlay">
						<h1>Title</h1>
						<div class="photo-controls">
							<button type="button" class="btn btn-default select-button">
								Select <span class="glyphicon glyphicon-plus-sign"></span>
							</button>
							<a href="${data.items[i]._links.download}" class="btn btn-default download-button">
								<span class="glyphicon glyphicon-download-alt"></span>
							</a>
						</div>
					</div>
				</div>`
			}

			$('#photo-grid').append(content);
			$('.select-button').on('click', handleSelectButtonClick);
		//$('.download-button').on('click', handleSingleDownloadClick);
		});
	}

	// Fix me :'(
	function handleSelectButtonClick() {
		if (Modernizr.touch) {
			if ($(this).hasClass('btn-default')) {
				$(this)
					.removeClass('btn-default')
					.addClass('btn-success')
					.html('Selected <span class="glyphicon glyphicon-ok-circle"></span>');

					$this = $(this);
					selectPhoto($this);
			} else {
				$(this)
					.removeClass('btn-success')
					.addClass('btn-default')
					.html('Select <span class="glyphicon glyphicon-plus-sign"></span>');

					$this = $(this);
					selectPhoto($this);
			}
		} else {
			// Initial view, and after a photo has been deselected
			if ($(this).hasClass('btn-default')) {
				$(this)
					.removeClass('btn-default')
					.addClass('btn-success')
					.html('Selected <span class="glyphicon glyphicon-ok-circle"></span>');

					var $this = $(this);
					selectPhoto($this);
			} 

			// If been has been selected...
			if ($(this).hasClass('btn-success')) {
				// ...on mouseover tell user that they can deselect it
				$(this).mouseover(function () { 
					$(this)
						.removeClass('btn-success')
						.addClass('btn-danger')
						.html('Remove <span class="glyphicon glyphicon-minus-sign"></span>');
				});
				 // ...go back to regular selected view
				$(this).mouseleave(function() {
					if (!$(this).hasClass('btn-default')) {
						$(this)
							.removeClass('btn-danger')
							.addClass('btn-success')
							.html('Selected <span class="glyphicon glyphicon-ok-circle"></span>');
					}
				});
			}
			
			// Has this class when selected AND hovered over
			if ($(this).hasClass('btn-danger')) {
				$(this)
					.off('mouseover')
					.removeClass('btn-danger')
					.addClass('btn-default')
					.html('Select <span class="glyphicon glyphicon-plus-sign"></span>');

					var $this = $(this);
					deselectPhoto($this);
			}
		}
	}

	// Figure this out, stackoverflow said iframes
	function handleSingleDownloadClick(e) {
		e.preventDefault();
	}

	function selectPhoto($this) {
		var downloadLink = $this.parent().parent().parent().attr('downloadLink');
		selectedPhotoLinks.push(downloadLink);
	}

	function deselectPhoto($this) {
		var downloadLink = $this.parent().parent().parent().attr('downloadLink');
		console.log(downloadLink);
		var index = selectedPhotoLinks.indexOf(downloadLink);
		console.log(index);
		selectedPhotoLinks.splice(index, 1);
	}

	//	TO TEST WITH REAL IMAGES FOR STYLING
	
	// async function generateImages(ApiCall) {
	// 	let response = await fetch(ApiCall);
	// 	let data = await response.json();
	// 	data = getLinks(data);
	// 	getImageData(data);
	// }
	
	// function getLinks(response) {
	// 	let rawLinks = [];
	// 	let parsedLinks = [];
	// 	let itemsArray = response.items;

	// 	itemsArray.forEach(item => {
	// 		rawLinks.push(item._links.self_all);
	// 	});

	// 	rawLinks.forEach(link => {
	// 		parsedLinks.push(parseLink(link, 3));
	// 	})

	// 	return parsedLinks;
	// }

	// function parseLink(path, start) {
	// 	let indices = [];
	// 	for (let i = 0; i <path.length; i++) {
	// 		if (path[i] === '/') indices.push(i);
	// 	}
	// 	return path.slice(indices[start] + 1);
	// }

	// function getImageData(imageData) {
	// 	imageData.forEach(async function(link) {
	// 		let response = await fetch(API_BASE + link);
	// 		let data = await response.json();
	// 		appendImage(data);
	// 	});
		
	// }

	// function appendImage(response) {
	// 	let element = document.createElement('div');
	// 	let photoGrid = document.getElementById('photo-grid');

	// 	element.innerHTML = `
	// 	<img src="${response.thumbnails['300px'].url}"></img>
	// 	<div class="overlay">
	// 		<h1>Title</h1>
	// 		<div class="photo-controls">
	// 			<button type="button" class="btn btn-default select-button">
	// 				Select <span class="glyphicon glyphicon-plus-sign"></span>
	// 			</button>
	// 			<button type="button" class="btn btn-default download-button">
	// 				<span class="glyphicon glyphicon-download-alt"></span>
	// 			</button>
	// 		</div>
	// 	</div>`;

	// 	element.className = 'item';
	// 	element.id = response.id;

	// 	photoGrid.append(element);

	// 	$('#' + response.id + ' .select-button').on('click', handleSelectButtonClick);
	// }

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