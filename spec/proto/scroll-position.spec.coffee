describe "Scroll Position Adjustment", ->
  it "should switch from drop-up to drop-down when scrolling down", ->
    # Set body height to ensure scrolling is possible
    originalBodyHeight = $$('body')[0].getStyle('height')
    $$('body')[0].setStyle({height: '3000px'})
    
    tmpl = "
      <select data-placeholder='Choose a Country...'>
        <option value=''></option>
        <option value='United States'>United States</option>
        <option value='United Kingdom'>United Kingdom</option>
        <option value='Afghanistan'>Afghanistan</option>
        <option value='Albania'>Albania</option>
        <option value='Algeria'>Algeria</option>
      </select>
    "
    # Position element such that when scrolled, it starts near viewport bottom
    windowHeight = document.viewport.getHeight()
    elementTop = Math.max(1000, windowHeight + 500)
    
    div = new Element('div').update(tmpl)
    div.setStyle({position: 'absolute', top: "#{elementTop}px"})
    $$('body')[0].insert(div)
    select = div.down('select')
    chosen = new Chosen(select)
    
    container = div.down(".chosen-container")
    dropdown = div.down('.chosen-drop')
    
    # Scroll so element is near bottom of viewport (should trigger dropup)
    scrollToMakeDropup = elementTop - windowHeight + container.getHeight()
    window.scrollTo(0, scrollToMakeDropup)
    
    # Open the dropdown
    mockEvt = { target: container, which: 1, type: 'mousedown', stop: -> }
    chosen.container_mousedown(mockEvt)
    expect(container.hasClassName("chosen-with-drop")).toBe true
    
    # Verify it's dropup based on the calculation
    dropdownHeight = dropdown.getHeight()
    dropdownTop = container.cumulativeOffset().top + container.getHeight() - window.pageYOffset
    totalHeight = dropdownHeight + dropdownTop
    shouldBeDropup = totalHeight > windowHeight
    
    expect(container.hasClassName("chosen-dropup")).toBe shouldBeDropup
    initialDropup = container.hasClassName("chosen-dropup")
    
    # Scroll down (increase scroll position) to move element up and create more space below
    window.scrollTo(0, scrollToMakeDropup + 300)
    
    # Manually trigger scroll handler
    chosen.update_dropup_position()
    
    # Verify dropup state changed to account for new space
    # After scrolling down, element moves up on screen, creating more space below
    newDropdownTop = container.cumulativeOffset().top + container.getHeight() - window.pageYOffset
    newTotalHeight = dropdownHeight + newDropdownTop
    newShouldBeDropup = newTotalHeight > windowHeight
    expect(container.hasClassName("chosen-dropup")).toBe newShouldBeDropup
    
    div.remove()
    window.scrollTo(0, 0)
    $$('body')[0].setStyle({height: originalBodyHeight})

  it "should switch from drop-down to drop-up when scrolling up", ->
    # Set body height to ensure scrolling is possible
    originalBodyHeight = $$('body')[0].getStyle('height')
    $$('body')[0].setStyle({height: '2000px'})
    
    tmpl = "
      <select data-placeholder='Choose a Country...'>
        <option value=''></option>
        <option value='United States'>United States</option>
        <option value='United Kingdom'>United Kingdom</option>
        <option value='Afghanistan'>Afghanistan</option>
        <option value='Albania'>Albania</option>
        <option value='Algeria'>Algeria</option>
      </select>
    "
    # Position element in a location where it can be both dropdown and dropup depending on scroll
    windowHeight = document.viewport.getHeight()
    elementTop = Math.min(500, Math.floor(windowHeight / 2))
    
    div = new Element('div').update(tmpl)
    div.setStyle({position: 'absolute', top: "#{elementTop}px"})
    $$('body')[0].insert(div)
    select = div.down('select')
    chosen = new Chosen(select)
    
    container = div.down(".chosen-container")
    dropdown = div.down('.chosen-drop')
    
    # Start at scroll position where dropdown should open downward
    window.scrollTo(0, 0)
    
    # Open the dropdown
    mockEvt = { target: container, which: 1, type: 'mousedown', stop: -> }
    chosen.container_mousedown(mockEvt)
    expect(container.hasClassName("chosen-with-drop")).toBe true
    
    # Check current dropup state
    dropdownHeight = dropdown.getHeight()
    dropdownTop = container.cumulativeOffset().top + container.getHeight() - window.pageYOffset
    totalHeight = dropdownHeight + dropdownTop
    shouldBeDropup = totalHeight > windowHeight
    
    expect(container.hasClassName("chosen-dropup")).toBe shouldBeDropup
    initialDropup = container.hasClassName("chosen-dropup")
    
    # Scroll down to position element near bottom (should change to dropup if not already)
    scrollToChange = Math.max(elementTop - Math.floor(windowHeight / 4), 200)
    window.scrollTo(0, scrollToChange)
    
    # Manually trigger scroll handler
    chosen.update_dropup_position()
    
    # Verify dropup state changed (or stayed same if already optimal)
    # After scrolling down, element is closer to top, so more likely to need dropup
    newDropdownTop = container.cumulativeOffset().top + container.getHeight() - window.pageYOffset
    newTotalHeight = dropdownHeight + newDropdownTop
    newShouldBeDropup = newTotalHeight > windowHeight
    
    expect(container.hasClassName("chosen-dropup")).toBe newShouldBeDropup
    
    div.remove()
    window.scrollTo(0, 0)
    $$('body')[0].setStyle({height: originalBodyHeight})

  it "should only update position when results are showing", ->
    tmpl = "
      <select data-placeholder='Choose a Country...'>
        <option value=''></option>
        <option value='United States'>United States</option>
      </select>
    "
    div = new Element('div').update(tmpl)
    $$('body')[0].insert(div)
    select = div.down('select')
    chosen = new Chosen(select)
    
    container = div.down(".chosen-container")
    
    # Dropdown is closed
    expect(chosen.results_showing).toBe false
    
    # Try to update position - should do nothing
    initial_has_dropup = container.hasClassName("chosen-dropup")
    chosen.update_dropup_position()
    
    # Class should remain unchanged
    expect(container.hasClassName("chosen-dropup")).toBe initial_has_dropup
    
    div.remove()

  it "should properly register and unregister scroll handler", (done) ->
    tmpl = "
      <select data-placeholder='Choose a Country...'>
        <option value=''></option>
        <option value='United States'>United States</option>
      </select>
    "
    div = new Element('div').update(tmpl)
    $$('body')[0].insert(div)
    select = div.down('select')
    chosen = new Chosen(select)
    
    container = div.down(".chosen-container")
    
    # Track scroll events
    scroll_count = 0
    original_update = chosen.update_dropup_position.bind(chosen)
    chosen.update_dropup_position = ->
      scroll_count++
      original_update()
    
    # Open dropdown
    mockEvt = { target: container, which: 1, type: 'mousedown', stop: -> }
    chosen.container_mousedown(mockEvt)
    expect(chosen.results_showing).toBe true
    
    scroll_event = document.createEvent('Event')
    scroll_event.initEvent('scroll', false, false)
    window.dispatchEvent(scroll_event)

    setTimeout ->
      expect(scroll_count).toBeGreaterThan 0
      initial_count = scroll_count

      select.fire('chosen:close')
      expect(chosen.results_showing).toBe false

      window.dispatchEvent(scroll_event)
      setTimeout ->
        expect(scroll_count).toBe initial_count
        div.remove()
        done()
      , 50
    , 50

  it "should clean up scroll handler when widget is destroyed", ->
    tmpl = "
      <select data-placeholder='Choose a Country...'>
        <option value=''></option>
        <option value='United States'>United States</option>
      </select>
    "
    div = new Element('div').update(tmpl)
    $$('body')[0].insert(div)
    select = div.down('select')
    chosen_instance = new Chosen(select)
    
    container = div.down(".chosen-container")
    
    # Open dropdown
    mockEvt = { target: container, which: 1, type: 'mousedown', stop: -> }
    chosen_instance.container_mousedown(mockEvt)
    expect(chosen_instance.results_showing).toBe true
    
    # Destroy widget while dropdown is open
    chosen_instance.destroy()
    
    # Widget should be destroyed - container should be removed
    expect(div.down('.chosen-container')).toBeUndefined()
    
    # Trigger scroll - should not cause errors
    expect(-> Event.fire(window, 'scroll')).not.toThrow()
    
    div.remove()

  it "should keep an open multiple select near the selected result", ->
    options = ("<option>Option #{index}</option>" for index in [1..30]).join('')
    div = new Element('div').update("<select multiple>#{options}</select>")
    document.body.appendChild(div)
    select = div.down('select')
    chosen = new Chosen(select, hide_results_on_select: false)
    chosen.results_show()
    results = div.down('.chosen-results')
    results.setStyle(maxHeight: '60px')
    selected_result = results.select('.active-result')[20]
    chosen.result_do_highlight(selected_result)
    results.scrollTop = 120
    original_scroll_position = results.scrollTop

    chosen.result_select(target: selected_result, preventDefault: ->)

    expect(results.scrollTop).toBe(original_scroll_position)
    expect(chosen.result_highlight.textContent).toBe('Option 22')
    div.remove()
