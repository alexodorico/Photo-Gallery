$(function() {
	const API_BASE = 'https://morleynet.morleycms.com/components/handlers/DamApiHandler.ashx?request=';
	const API_QUERY = 'assets/search?query_category=Morley+Asset%2FPhotography&limit=18';
	let ApiCall = API_BASE + API_QUERY;
	
	fetch(ApiCall)
		.then(getStatus)
		.then(toJson)
		.then(getLinks)
		.then(getImagesFromDAM)
		.catch(err => {
			console.log(`Error: ${err}`);
		});
	
	function getStatus(response) {
		if (response.status >= 200 && response.status < 300) {
			return Promise.resolve(response);
		} else {
			return Promise.reject(new Error(response.statusText));
		}
	}

	function toJson(response) {
		return response.json();
	}

	function getLinks(response) {
		let rawLinks = [];
		let parsedLinks = [];
		let itemsArray = response.items;
		itemsArray.forEach(item => {
			rawLinks.push(item._links.self_all);
		});
		rawLinks.forEach(link => {
			parsedLinks.push(parseLink(link, 3));
		})
		return parsedLinks;
	}

	function parseLink(path, start, end) {
		let indices = [];
		for (let i = 0; i <path.length; i++) {
			if (path[i] === '/') indices.push(i);
		}
		return path.slice(indices[start] + 1, indices[end]);
	}

	function getImagesFromDAM(response) {
		response.forEach(link => {
			fetch(API_BASE + link)
				.then(getStatus)
				.then(toJson)
				.then(response => {
					console.log(response);
				})
				.catch(err => {
					console.log(`Error: ${err}`);
				});
		});
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