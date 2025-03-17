// SIDEBAR DROPDOWN
const allDropdown = document.querySelectorAll('#sidebar .side-dropdown');
const sidebar = document.getElementById('sidebar');

allDropdown.forEach(item => {
    const a = item.parentElement.querySelector('a:first-child');

    // Ensure this only runs for menu items that have dropdowns
    if (item) {
        a.addEventListener('click', function (e) {
            e.preventDefault();

            // Only toggle menus that have dropdowns
            if (!this.classList.contains('active')) {
                allDropdown.forEach(i => {
                    const aLink = i.parentElement.querySelector('a:first-child');
                    aLink.classList.remove('active');
                    i.classList.remove('show');
                });
            }

            this.classList.toggle('active');
            item.classList.toggle('show');
        });
    }
});

// Prevent the issue where Dashboard is treated like a dropdown menu
document.querySelectorAll('#sidebar .side-menu > li > a').forEach(menuItem => {
    menuItem.addEventListener('click', function () {
        if (!this.nextElementSibling || !this.nextElementSibling.classList.contains('side-dropdown')) {
            // Ensure only menu items with dropdowns get the toggle behavior
            allDropdown.forEach(dropdown => {
                dropdown.classList.remove('show');
                const parentLink = dropdown.parentElement.querySelector('a:first-child');
                parentLink.classList.remove('active');
            });
        }
    });
});

// PROFILE DROPDOWN
const profile = document.querySelector('nav .profile');
const imgProfile = profile.querySelector('img');
const dropdownProfile = profile.querySelector('.profile-link');

imgProfile.addEventListener('click', function () {
	dropdownProfile.classList.toggle('show');
})




// MENU
const allMenu = document.querySelectorAll('main .content-data .head .menu');

allMenu.forEach(item=> {
	const icon = item.querySelector('.icon');
	const menuLink = item.querySelector('.menu-link');

	icon.addEventListener('click', function () {
		menuLink.classList.toggle('show');
	})
})



window.addEventListener('click', function (e) {
	if(e.target !== imgProfile) {
		if(e.target !== dropdownProfile) {
			if(dropdownProfile.classList.contains('show')) {
				dropdownProfile.classList.remove('show');
			}
		}
	}

	allMenu.forEach(item=> {
		const icon = item.querySelector('.icon');
		const menuLink = item.querySelector('.menu-link');

		if(e.target !== icon) {
			if(e.target !== menuLink) {
				if (menuLink.classList.contains('show')) {
					menuLink.classList.remove('show')
				}
			}
		}
	})
})









