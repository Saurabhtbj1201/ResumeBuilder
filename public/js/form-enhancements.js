document.addEventListener('DOMContentLoaded', function () {
    function addEntry(containerId, entryClassName, buttonId, entryTitlePrefix) {
        const container = document.getElementById(containerId);
        const addButton = document.getElementById(buttonId);
        
        // Only proceed if container and addButton exist on the current page
        if (!container || !addButton) {
            // console.warn(`Container or button not found for ${containerId}, skipping addEntry setup.`);
            return;
        }

        let entryCounter = container.getElementsByClassName(entryClassName).length;

        const firstEntry = container.querySelector(`.${entryClassName}`);
        if (!firstEntry) {
            console.warn(`First entry template not found for ${entryClassName} in container ${containerId}`);
            return;
        }

        addButton.addEventListener('click', function () {
            entryCounter++;
            const newEntry = firstEntry.cloneNode(true);
            
            // Update title for the new entry
            const titleElement = newEntry.querySelector('h4');
            if (titleElement) {
                titleElement.textContent = `${entryTitlePrefix} Entry ${entryCounter}`;
            }

            // Clear input values and remove 'required' from cloned non-first entries if needed
            newEntry.querySelectorAll('input, textarea').forEach(input => {
                input.value = '';
                // For experience, the first block is required. Subsequent ones are not.
                // For projects and education, they are optional from the start.
                if (entryClassName === 'experience-entry') {
                     // Keep required for the first block, remove for cloned ones if desired
                     // For simplicity, we'll keep them required, user can leave them blank if they don't want to fill
                     // Or, you can remove the required attribute:
                     // input.removeAttribute('required');
                } else {
                    input.removeAttribute('required'); // Projects/Education fields are not required by default in cloned sections
                }
            });
            
            // Add a remove button to the new entry
            const removeButton = document.createElement('button');
            removeButton.type = 'button';
            removeButton.textContent = 'Remove This Entry';
            removeButton.classList.add('btn', 'btn-danger', 'btn-sm', 'remove-entry-btn');
            removeButton.style.marginTop = '10px';
            removeButton.style.marginBottom = '10px'; // Add some bottom margin
            removeButton.addEventListener('click', function() {
                newEntry.remove();
                // Renumber remaining entries if necessary (optional)
            });
            newEntry.appendChild(removeButton);

            container.appendChild(newEntry);
        });
    }

    // Check if the specific containers exist before trying to set up the "addEntry" functionality
    if (document.getElementById('experienceContainer')) {
        addEntry('experienceContainer', 'experience-entry', 'addExperienceBtn', 'Experience');
    }
    if (document.getElementById('projectsContainer')) {
        addEntry('projectsContainer', 'project-entry', 'addProjectBtn', 'Project');
    }
    if (document.getElementById('educationContainer')) {
        addEntry('educationContainer', 'education-entry', 'addEducationBtn', 'Education');
    }
    if (document.getElementById('certificationContainer')) {
        addEntry('certificationContainer', 'certification-entry', 'addCertificationBtn', 'Certification');
    }
    if (document.getElementById('awardsContainer')) {
        addEntry('awardsContainer', 'award-entry', 'addAwardBtn', 'Award/Achievement');
    }
});
