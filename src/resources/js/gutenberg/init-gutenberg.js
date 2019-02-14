import { domReady, editPost, data } from '@frontkom/gutenberg-js'
import { postPage } from './api-fetch'
import { editorSettings, overridePost } from './settings'

/**
 * Add the 'Save' button to the Gutenberg editor
 * @param {bool} isNew set to true if creating a new page
 */
function setupSubmit (isNew) {
  let buttonContainer
  let headerExists = setInterval(() => {
    buttonContainer = document.getElementsByClassName('edit-post-header__settings')[0]
    if (buttonContainer) {
      let button = document.createElement('div')
      button.innerHTML = `<button id="submit-page-button" class="components-button editor-post-publish-button is-button is-default is-primary is-large">Save</button>`

      // We want the button to behave differently depending on the page being created or edited
      if (isNew) {
        button.addEventListener('click', submitPage)
      } else {
        button.addEventListener('click', data.dispatch('core/editor').savePost)
      }
      buttonContainer.append(button)
      clearInterval(headerExists)
    }
  }, 100)
}

/**
 * Replaces the default Gutenberg delete button behaviour
 * @param {int} pageId
 */
function setupDelete (pageId) {
  let button
  let buttonExists = setInterval(() => {
    button = document.getElementsByClassName('editor-post-trash')[0]
    if (button) {
      button.addEventListener('click', function (event) {
        data.dispatch('core/editor').trashPost(pageId, 'page')
        window.location.href = '/laraberg/ui/pages'
        event.stopPropagation()
      }, true)
      clearInterval(buttonExists)
    }
  })
}

/**
 * Gets the content + title and makes a post call to the API
 * @param {event} event
 */
function submitPage (event) {
  // Disable save button to prevent multiple submits
  // event.target.disabled = true
  const content = data.select('core/editor').getEditedPostContent()
  const title = data.select('core/editor').getEditedPostAttribute('title')

  postPage({ data: { content: content, title: title } })
    .then(data => {
      // Remove body on success to prevent 'onunload' messages from showing
      // there probably is a better way to do this, but I do not know how.
      document.getElementsByTagName('body')[0].remove()
      window.location.href = `/laraberg/ui/pages/${data.id}`
    })
    .catch(() => { event.target.disabled = false })
}

/**
 *
 * @param {string} target element ID to attach editor to
 * @param {int} pageId ID of the page to edit (0 if page is new)
 * @param {boolean} isNew True if creating a new page
 */
function attach (target, pageId, isNew) {
  // Initializing the editor!
  window._wpLoadGutenbergEditor = new Promise(function (resolve) {
    domReady(function () {
      resolve(editPost.initializeEditor(target, 'page', pageId, editorSettings, overridePost))
    })
    domReady(() => {
      setupSubmit(isNew)
    })
  })
}

/**
 * Initialize the Gutenberg editor
 * @param {string} target the element ID to render the gutenberg editor in
 */
export default function initGutenberg (target, pageId) {
  if (!pageId) {
    editorSettings.canSave = false
    attach(target, 0, true)
  } else {
    attach(target, pageId)
    setupDelete(pageId)
  }
}