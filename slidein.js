// slidein.js
// Handles creation and rendering of the slide-in window and its HTML elements

function createSlideinHeader(container, closeCallback) {
  const header = document.createElement('div');
  header.classList.add('bnk-header');

  // Add collapse button if it's a floating container
  if (container.classList.contains('bnk-floating-container')) {
    const collapseBtn = document.createElement('button');
    collapseBtn.classList.add('bnk-collapse-btn');
    collapseBtn.innerHTML = '<svg viewBox="0 0 20 20" width="18" height="18"><path d="M12.4 4.6L8 9l4.4 4.4c.6.6.6 1.5 0 2.1-.6.6-1.5.6-2.1 0l-5.5-5.5c-.6-.6-.6-1.5 0-2.1L10.3 2.5c.6-.6 1.5-.6 2.1 0 .6.6.6 1.6 0 2.1z"/></svg>';
    collapseBtn.title = 'Hide';
    collapseBtn.onclick = () => {
      const isCollapsed = container.classList.toggle('collapsed');
      chrome.storage.local.set({ 'bnkContainerCollapsed': isCollapsed });
    };
    header.appendChild(collapseBtn);
  }

  const h3 = document.createElement('h3');
  h3.textContent = 'Shopify Expander';
  h3.classList.add('Polaris-Text--root', 'Polaris-Text--headingSm', 'bnk-title');

  // const closeButton = document.createElement('button');
  // closeButton.innerHTML = '×';
  // closeButton.title = 'Close';
  // closeButton.classList.add('bnk-close-button');
  // closeButton.onclick = closeCallback;

  header.appendChild(h3);
  // header.appendChild(closeButton);
  container.appendChild(header);
  return header;
}

function createSlideinList(data) {
  const ul = document.createElement('ul');
  ul.classList.add('bnk-container');
  const regularFields = ['id', 'title', 'handle', 'createdAt', 'updatedAt'];
  const entries = Object.entries(data);

  // Non-metafields
  entries.filter(([key]) => regularFields.includes(key)).forEach(([key, value]) => {
    if (!value || value === 'null') return;
    const li = document.createElement('li');
    let displayValue = value;
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
      displayValue = `${window.bnkUtils.formatDate(value)} (${window.bnkUtils.getDaysElapsed(value)})`;
    }
  li.innerHTML = `<span class="bnk-field-key">${key}:</span> ${displayValue}`;
    li.title = 'Click to copy';
    li.onclick = () => {
      navigator.clipboard.writeText(value).then(() => {
        const originalText = li.innerHTML;
        li.innerHTML = `${originalText} <span class='copy-confirm'>✔ Copied</span>`;
        setTimeout(() => {
          li.querySelector('.copy-confirm').remove();
        }, 1500);
      }).catch(err => console.error('Failed to copy:', err));
    };
    ul.appendChild(li);
  });

  // Metafields
  entries.filter(([key]) => !regularFields.includes(key)).forEach(([key, value]) => {
    if (!value || value === 'null') return;
    const li = document.createElement('li');
    let displayValue = value;
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
      displayValue = `${window.bnkUtils.formatDate(value)} (${window.bnkUtils.getDaysElapsed(value)})`;
    }
  li.innerHTML = `<span class="bnk-field-key">${key}:</span> ${displayValue}`;
    li.title = 'Click to copy';
    li.onclick = () => {
      navigator.clipboard.writeText(value).then(() => {
        const originalText = li.innerHTML;
        li.innerHTML = `${originalText} <span class='copy-confirm'>✔ Copied</span>`;
        setTimeout(() => {
          li.querySelector('.copy-confirm').remove();
        }, 1500);
      }).catch(err => console.error('Failed to copy:', err));
    };
    ul.appendChild(li);
  });
  return ul;
}

function createSlideinButtons(isJsonPage, targetPath, editFieldsCallback) {
  const buttonContainer = document.createElement('div');
  buttonContainer.classList.add('bnk-button-container');

  const jsonButton = document.createElement('a');
  jsonButton.href = targetPath;
  jsonButton.classList.add('Polaris-Button', 'Polaris-Button--primary');
  jsonButton.innerHTML = `
    <span class="Polaris-Button__Content">
      <span class="Polaris-Button__Icon" title="${isJsonPage ? 'View Page' : 'View JSON'}">${
        isJsonPage
          ? '<svg xmlns="http://www.w3.org/2000/svg" fill-rule="evenodd" clip-rule="evenodd" viewBox="0 0 466 511.963" style= "height: 12px;" ><path d="M76.065 104.048c14.039 10.427 28.933 21.173 36.759 25.607 19.558 11.169 22.836 38.57 14.408 39.74-3.338.464-14.432-5.327-27.253-12.986-29.561-17.661-74.927-47.317-93.527-76.33C2.224 73.483-.346 66.995.038 61.192c.293-4.445 2.788-7.708 8.265-9.366C47.897 36.613 82.725 19.974 111.131 1.415c2.42-1.346 4.619-1.695 6.631-1.203 6.712 1.64 12.585 15.647 14.456 21.588 2.694 8.553 1.685 13.59-5.18 18.338-13.515 9.346-28.999 16.228-44.546 22.911 111.908 7.207 204.019 54.796 269.926 126.745 72.915 79.599 113.669 188.977 113.581 306.364-.004 6.723-.577 10.496-4.081 13.312-3.164 2.542-7.141 2.712-14.118 2.348-10.814-.563-16.828-2.623-20.808-9.195-3.403-5.62-4.254-13.817-5.081-27.422-.244-4.013-.617-8.023-.884-12.037-6.55-98.572-45.366-189.537-110.1-255.329-58.576-59.533-138.435-98.473-234.862-103.787z"/></svg>'
          : '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>language_json</title> <rect width="24" height="24" fill="none"></rect> <path d="M5,3H7V5H5v5a2,2,0,0,1-2,2,2,2,0,0,1,2,2v5H7v2H5c-1.07-.27-2-.9-2-2V15a2,2,0,0,0-2-2H0V11H1A2,2,0,0,0,3,9V5A2,2,0,0,1,5,3M19,3a2,2,0,0,1,2,2V9a2,2,0,0,0,2,2h1v2H23a2,2,0,0,0-2,2v4a2,2,0,0,1-2,2H17V19h2V14a2,2,0,0,1,2-2,2,2,0,0,1-2-2V5H17V3h2M12,15a1,1,0,1,1-1,1,1,1,0,0,1,1-1M8,15a1,1,0,1,1-1,1,1,1,0,0,1,1-1m8,0a1,1,0,1,1-1,1A1,1,0,0,1,16,15Z"></path> </g></svg>'
      }
      </span>
    </span>
  `;

  const editFieldsBtn = document.createElement('button');
  editFieldsBtn.className = 'Polaris-Button bnk-shopify-secondary-btn';
  editFieldsBtn.innerHTML = `
    <span class="Polaris-Button__Content Polaris-Button Polaris-Button--sizeMedium Polaris-Button--variantSecondary">
      <span class="Polaris-Button__Icon" title="Edit fetched fields">
        <svg viewBox="0 0 20 20" class="Polaris-Icon__Svg" focusable="false" aria-hidden="true"><path fill-rule="evenodd" d="M15.655 4.344a2.695 2.695 0 0 0-3.81 0l-.599.599-.009-.009-1.06 1.06.008.01-5.88 5.88a2.75 2.75 0 0 0-.805 1.944v1.922a.75.75 0 0 0 .75.75h1.922a2.75 2.75 0 0 0 1.944-.806l7.54-7.539a2.695 2.695 0 0 0 0-3.81Zm-4.409 2.72-5.88 5.88a1.25 1.25 0 0 0-.366.884v1.172h1.172c.331 0 .65-.132.883-.366l5.88-5.88-1.689-1.69Zm2.75.629.599-.599a1.195 1.195 0 1 0-1.69-1.689l-.598.599 1.69 1.689Z"></path></svg>
      </span>
    </span>
  `;
  editFieldsBtn.onclick = (e) => {
    e.preventDefault();
    editFieldsCallback();
  };

  // const closeButton = document.createElement('button');
  // closeButton.innerHTML = '×';
  // closeButton.title = 'Close';
  // closeButton.classList.add('bnk-close-button');
  // closeButton.onclick = closeCallback;

  // buttonContainer.appendChild(closeButton);
  buttonContainer.appendChild(editFieldsBtn);
  buttonContainer.appendChild(jsonButton);

  return buttonContainer;
}

function renderSlidein(data, container, editFieldsCallback) {
  container.innerHTML = '';
  const header = createSlideinHeader(container, () => {
    const card = container.closest('.Polaris-LegacyCard.bnk');
    if (card) {
      card.remove();
    } else {
      container.classList.add('removing');
      setTimeout(() => {
        container.remove();
      }, 900);
    }
  });
  const ul = createSlideinList(data);
  container.appendChild(ul);
  const isJsonPage = window.location.pathname.endsWith('.json');
  const targetPath = isJsonPage ? window.location.pathname.slice(0, -5) : window.location.pathname + '.json';
  const buttons = createSlideinButtons(isJsonPage, targetPath, editFieldsCallback);
  header.appendChild(buttons);

  // Add Edit Fields button at the bottom of the slide-in
  // const editFieldsBtn = document.createElement('button');
  // editFieldsBtn.className = 'Polaris-Button bnk-shopify-secondary-btn';
  // editFieldsBtn.innerHTML = `
  //   <span class="Polaris-Button__Content Polaris-Button Polaris-Button--sizeMedium Polaris-Button--variantSecondary">
  //     <span class="Polaris-Button__Icon" title="Edit">
  //       <svg viewBox="0 0 20 20" class="Polaris-Icon__Svg" focusable="false" aria-hidden="true"><path fill-rule="evenodd" d="M15.655 4.344a2.695 2.695 0 0 0-3.81 0l-.599.599-.009-.009-1.06 1.06.008.01-5.88 5.88a2.75 2.75 0 0 0-.805 1.944v1.922a.75.75 0 0 0 .75.75h1.922a2.75 2.75 0 0 0 1.944-.806l7.54-7.539a2.695 2.695 0 0 0 0-3.81Zm-4.409 2.72-5.88 5.88a1.25 1.25 0 0 0-.366.884v1.172h1.172c.331 0 .65-.132.883-.366l5.88-5.88-1.689-1.69Zm2.75.629.599-.599a1.195 1.195 0 1 0-1.69-1.689l-.598.599 1.69 1.689Z"></path></svg>
  //     </span>
  //     Edit Fields
  //   </span>
  // `;
  // editFieldsBtn.onclick = (e) => {
  //   e.preventDefault();
  //   editFieldsCallback();
  // };
  // container.appendChild(editFieldsBtn);
}

// window.renderSlidein = renderSlidein;
