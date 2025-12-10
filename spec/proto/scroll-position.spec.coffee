describe "Scroll Position Adjustment", ->
  it "should switch from drop-up to drop-down when scrolling down", ->
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
    div = new Element('div').update(tmpl)
    div.setStyle({position: 'absolute', top: '2000px'})
    $$('body')[0].insert(div)
    select = div.down('select')
    new Chosen(select)
    
    container = div.down(".chosen-container")
    chosen = select.chosenInstance
    
    # Scroll to position where dropdown should open upward
    window.scrollTo(0, 2000)
    
    # Open the dropdown
    container.fire('mousedown')
    expect(container.hasClassName("chosen-with-drop")).toBe true
    
    # Should initially be dropup
    expect(container.hasClassName("chosen-dropup")).toBe true
    
    # Scroll down to create space below
    window.scrollTo(0, 1500)
    
    # Manually trigger scroll handler
    chosen.update_dropup_position()
    
    # Should now be dropdown (no dropup class)
    expect(container.hasClassName("chosen-dropup")).toBe false
    
    div.remove()
    window.scrollTo(0, 0)

  it "should switch from drop-down to drop-up when scrolling up", ->
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
    div = new Element('div').update(tmpl)
    div.setStyle({position: 'absolute', top: '500px'})
    $$('body')[0].insert(div)
    select = div.down('select')
    new Chosen(select)
    
    container = div.down(".chosen-container")
    chosen = select.chosenInstance
    
    # Start at top where dropdown should open downward
    window.scrollTo(0, 0)
    
    # Open the dropdown
    container.fire('mousedown')
    expect(container.hasClassName("chosen-with-drop")).toBe true
    
    # Should initially be dropdown (no dropup class)
    expect(container.hasClassName("chosen-dropup")).toBe false
    
    # Scroll down to remove space below
    window.scrollTo(0, 800)
    
    # Manually trigger scroll handler
    chosen.update_dropup_position()
    
    # Should now be dropup
    expect(container.hasClassName("chosen-dropup")).toBe true
    
    div.remove()
    window.scrollTo(0, 0)

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
    new Chosen(select)
    
    container = div.down(".chosen-container")
    chosen = select.chosenInstance
    
    # Dropdown is closed
    expect(chosen.results_showing).toBe false
    
    # Try to update position - should do nothing
    initial_has_dropup = container.hasClassName("chosen-dropup")
    chosen.update_dropup_position()
    
    # Class should remain unchanged
    expect(container.hasClassName("chosen-dropup")).toBe initial_has_dropup
    
    div.remove()

  it "should properly register and unregister scroll handler", ->
    tmpl = "
      <select data-placeholder='Choose a Country...'>
        <option value=''></option>
        <option value='United States'>United States</option>
      </select>
    "
    div = new Element('div').update(tmpl)
    $$('body')[0].insert(div)
    select = div.down('select')
    new Chosen(select)
    
    container = div.down(".chosen-container")
    chosen = select.chosenInstance
    
    # Track scroll events
    scroll_count = 0
    original_update = chosen.update_dropup_position.bind(chosen)
    chosen.update_dropup_position = ->
      scroll_count++
      original_update()
    
    # Open dropdown
    container.fire('mousedown')
    expect(chosen.results_showing).toBe true
    
    # Trigger scroll event
    Event.fire(window, 'scroll')
    
    # Handler should have been called
    expect(scroll_count).toBeGreaterThan 0
    
    initial_count = scroll_count
    
    # Close dropdown
    select.fire('chosen:close')
    expect(chosen.results_showing).toBe false
    
    # Trigger scroll event again
    Event.fire(window, 'scroll')
    
    # Handler should not be called anymore (count should not increase)
    # Note: Due to throttling, we need to wait a bit
    expect(scroll_count).toBe initial_count
    
    div.remove()

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
    container.fire('mousedown')
    expect(chosen_instance.results_showing).toBe true
    
    # Destroy widget while dropdown is open
    chosen_instance.destroy()
    
    # Widget should be destroyed - container should be removed
    expect(div.down('.chosen-container')).toBeNull()
    
    # Trigger scroll - should not cause errors
    expect(-> Event.fire(window, 'scroll')).not.toThrow()
    
    div.remove()
