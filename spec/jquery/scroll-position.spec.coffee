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
    div = $("<div>").html(tmpl).css({position: 'absolute', top: '2000px'})
    $('body').append(div)
    select = div.find("select")
    select.chosen()
    
    container = div.find(".chosen-container")
    chosen = select.data('chosen')
    
    # Scroll to position where dropdown should open upward
    window.scrollTo(0, 2000)
    
    # Open the dropdown
    container.trigger("mousedown")
    expect(container.hasClass("chosen-with-drop")).toBe true
    
    # Should initially be dropup
    expect(container.hasClass("chosen-dropup")).toBe true
    
    # Scroll down to create space below
    window.scrollTo(0, 1500)
    
    # Manually trigger scroll handler
    chosen.update_dropup_position()
    
    # Should now be dropdown (no dropup class)
    expect(container.hasClass("chosen-dropup")).toBe false
    
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
    div = $("<div>").html(tmpl).css({position: 'absolute', top: '500px'})
    $('body').append(div)
    select = div.find("select")
    select.chosen()
    
    container = div.find(".chosen-container")
    chosen = select.data('chosen')
    
    # Start at top where dropdown should open downward
    window.scrollTo(0, 0)
    
    # Open the dropdown
    container.trigger("mousedown")
    expect(container.hasClass("chosen-with-drop")).toBe true
    
    # Should initially be dropdown (no dropup class)
    expect(container.hasClass("chosen-dropup")).toBe false
    
    # Scroll down to remove space below
    window.scrollTo(0, 800)
    
    # Manually trigger scroll handler
    chosen.update_dropup_position()
    
    # Should now be dropup
    expect(container.hasClass("chosen-dropup")).toBe true
    
    div.remove()
    window.scrollTo(0, 0)

  it "should only update position when results are showing", ->
    tmpl = "
      <select data-placeholder='Choose a Country...'>
        <option value=''></option>
        <option value='United States'>United States</option>
      </select>
    "
    div = $("<div>").html(tmpl)
    $('body').append(div)
    select = div.find("select")
    select.chosen()
    
    container = div.find(".chosen-container")
    chosen = select.data('chosen')
    
    # Dropdown is closed
    expect(chosen.results_showing).toBe false
    
    # Try to update position - should do nothing
    initial_has_dropup = container.hasClass("chosen-dropup")
    chosen.update_dropup_position()
    
    # Class should remain unchanged
    expect(container.hasClass("chosen-dropup")).toBe initial_has_dropup
    
    div.remove()

  it "should properly register and unregister scroll handler", (done) ->
    tmpl = "
      <select data-placeholder='Choose a Country...'>
        <option value=''></option>
        <option value='United States'>United States</option>
      </select>
    "
    div = $("<div>").html(tmpl)
    $('body').append(div)
    select = div.find("select")
    select.chosen()
    
    container = div.find(".chosen-container")
    chosen = select.data('chosen')
    
    # Track scroll events
    scroll_count = 0
    original_update = chosen.update_dropup_position
    chosen.update_dropup_position = ->
      scroll_count++
      original_update.call(this)
    
    # Open dropdown
    container.trigger("mousedown")
    expect(chosen.results_showing).toBe true
    
    # Trigger scroll event
    $(window).trigger('scroll')
    
    # Wait for throttle timeout to complete
    setTimeout ->
      # Handler should have been called
      expect(scroll_count).toBeGreaterThan 0
      
      initial_count = scroll_count
      
      # Close dropdown
      select.trigger('chosen:close')
      expect(chosen.results_showing).toBe false
      
      # Trigger scroll event again
      $(window).trigger('scroll')
      
      # Wait for potential throttle timeout
      setTimeout ->
        # Handler should not be called anymore (count should not increase)
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
    div = $("<div>").html(tmpl)
    $('body').append(div)
    select = div.find("select")
    select.chosen()
    
    container = div.find(".chosen-container")
    chosen = select.data('chosen')
    
    # Open dropdown
    container.trigger("mousedown")
    expect(chosen.results_showing).toBe true
    
    # Destroy widget while dropdown is open
    select.chosen('destroy')
    
    # Widget should be destroyed
    expect(select.data('chosen')).toBeUndefined()
    
    # Trigger scroll - should not cause errors
    expect(-> $(window).trigger('scroll')).not.toThrow()
    
    div.remove()
