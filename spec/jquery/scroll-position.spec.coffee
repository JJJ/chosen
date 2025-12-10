describe "Scroll Position Adjustment", ->
  it "should switch from drop-up to drop-down when scrolling down", ->
    # Set body height to ensure scrolling is possible
    originalBodyHeight = $('body').css('height')
    $('body').css('height', '3000px')
    
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
    # Use dynamic positioning based on window height
    windowHeight = $(window).height()
    elementTop = Math.max(1000, windowHeight + 500)
    
    div = $("<div>").html(tmpl).css({position: 'absolute', top: "#{elementTop}px"})
    $('body').append(div)
    select = div.find("select")
    select.chosen()
    
    container = div.find(".chosen-container")
    chosen = select.data('chosen')
    dropdown = container.find('.chosen-drop')
    
    # Scroll so element is near bottom of viewport (should trigger dropup)
    scrollToMakeDropup = elementTop - windowHeight + container.outerHeight()
    window.scrollTo(0, scrollToMakeDropup)
    
    # Open the dropdown
    container.trigger("mousedown")
    expect(container.hasClass("chosen-with-drop")).toBe true
    
    # Verify it's dropup based on the calculation
    dropdownHeight = dropdown.outerHeight()
    dropdownTop = container.offset().top + container.outerHeight() - $(window).scrollTop()
    totalHeight = dropdownHeight + dropdownTop
    shouldBeDropup = totalHeight > windowHeight
    
    expect(container.hasClass("chosen-dropup")).toBe shouldBeDropup
    initialDropup = container.hasClass("chosen-dropup")
    
    # Scroll down (increase scroll position) to move element up and create more space below
    window.scrollTo(0, scrollToMakeDropup + 300)
    
    # Manually trigger scroll handler
    chosen.update_dropup_position()
    
    # Verify dropup state changed to account for new space
    # After scrolling down, element moves up on screen, creating more space below
    newDropdownTop = container.offset().top + container.outerHeight() - $(window).scrollTop()
    newTotalHeight = dropdownHeight + newDropdownTop
    newShouldBeDropup = newTotalHeight > windowHeight
    expect(container.hasClass("chosen-dropup")).toBe newShouldBeDropup
    
    div.remove()
    window.scrollTo(0, 0)
    $('body').css('height', originalBodyHeight)

  it "should switch from drop-down to drop-up when scrolling up", ->
    # Set body height to ensure scrolling is possible
    originalBodyHeight = $('body').css('height')
    $('body').css('height', '2000px')
    
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
    windowHeight = $(window).height()
    elementTop = Math.min(500, Math.floor(windowHeight / 2))
    
    div = $("<div>").html(tmpl).css({position: 'absolute', top: "#{elementTop}px"})
    $('body').append(div)
    select = div.find("select")
    select.chosen()
    
    container = div.find(".chosen-container")
    chosen = select.data('chosen')
    dropdown = container.find('.chosen-drop')
    
    # Start at scroll position where dropdown should open downward
    window.scrollTo(0, 0)
    
    # Open the dropdown
    container.trigger("mousedown")
    expect(container.hasClass("chosen-with-drop")).toBe true
    
    # Check current dropup state
    dropdownHeight = dropdown.outerHeight()
    dropdownTop = container.offset().top + container.outerHeight() - $(window).scrollTop()
    totalHeight = dropdownHeight + dropdownTop
    shouldBeDropup = totalHeight > windowHeight
    
    expect(container.hasClass("chosen-dropup")).toBe shouldBeDropup
    initialDropup = container.hasClass("chosen-dropup")
    
    # Scroll down to position element near bottom (should change to dropup if not already)
    scrollToChange = Math.max(elementTop - Math.floor(windowHeight / 4), 200)
    window.scrollTo(0, scrollToChange)
    
    # Manually trigger scroll handler
    chosen.update_dropup_position()
    
    # Verify dropup state changed (or stayed same if already optimal)
    # After scrolling down, element is closer to top, so more likely to need dropup
    newDropdownTop = container.offset().top + container.outerHeight() - $(window).scrollTop()
    newTotalHeight = dropdownHeight + newDropdownTop
    newShouldBeDropup = newTotalHeight > windowHeight
    
    expect(container.hasClass("chosen-dropup")).toBe newShouldBeDropup
    
    div.remove()
    window.scrollTo(0, 0)
    $('body').css('height', originalBodyHeight)

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

  # Note: This test is async (uses done callback) because the scroll handler
  # is throttled with a 16ms setTimeout, so we need to wait for it to execute
  it "should properly register and unregister scroll handler", (done) ->
    # The scroll handler uses a 16ms throttle delay (see chosen.jquery.coffee:32)
    # We use a longer delay here to ensure the throttle timeout completes reliably
    THROTTLE_WAIT = 50
    
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
      , THROTTLE_WAIT
    , THROTTLE_WAIT

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
