describe "Mobile support", ->
  it "keeps the opt-in picker open in the visible phone viewport and restores scrolling", ->
    previous_match_media = window.matchMedia
    previous_overflow = document.body.style.overflow
    window.matchMedia = -> { matches: true }
    document.body.style.overflow = 'auto'
    select = $("<select><option value=''></option><option value='a'>Atlas</option></select>").appendTo('body')
    select.chosen(mobile_fullscreen: true)
    chosen = select.data('chosen')
    chosen.results_show()
    expect(chosen.container.hasClass('chosen-mobile-fullscreen')).toBe true
    expect(document.body.style.overflow).toBe 'hidden'
    chosen.container.find('.chosen-mobile-close')[0].click()
    expect(chosen.results_showing).toBe false
    expect(document.body.style.overflow).toBe 'auto'
    select.chosen('destroy')
    select.remove()
    window.matchMedia = previous_match_media
    document.body.style.overflow = previous_overflow

  describe "mobile interactions", ->
    it "should initialize chosen on mobile device", ->
      # Mock iPhone user agent
      Object.defineProperty window.navigator, 'userAgent',
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
        writable: true
        configurable: true
      
      tmpl = "
        <select data-placeholder='Choose a Country...'>
          <option value=''></option>
          <option value='United States'>United States</option>
          <option value='United Kingdom'>United Kingdom</option>
          <option value='Afghanistan'>Afghanistan</option>
        </select>
      "
      div = $("<div>").html(tmpl)
      $('body').append(div)
      select = div.find("select")
      select.chosen()
      
      # Check that chosen container was created
      container = div.find(".chosen-container")
      expect(container.length).toBe 1
      expect(container.hasClass("chosen-container-single")).toBe true
      
      # Cleanup
      div.remove()
    
    it "should handle touchstart events", ->
      # Mock iPhone user agent
      Object.defineProperty window.navigator, 'userAgent',
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
        writable: true
        configurable: true
      
      tmpl = "
        <select data-placeholder='Choose a Country...'>
          <option value=''></option>
          <option value='United States'>United States</option>
          <option value='United Kingdom'>United Kingdom</option>
          <option value='Afghanistan'>Afghanistan</option>
        </select>
      "
      div = $("<div>").html(tmpl)
      $('body').append(div)
      select = div.find("select")
      select.chosen()
      
      container = div.find(".chosen-container")
      # Simulate touchstart to open the dropdown
      container.trigger("touchstart")
      expect(container.hasClass("chosen-container-active")).toBe true
      
      # Cleanup
      div.remove()
    
    it "should handle touchend on results", ->
      # Mock iPhone user agent
      Object.defineProperty window.navigator, 'userAgent',
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
        writable: true
        configurable: true
      
      tmpl = "
        <select data-placeholder='Choose a Country...'>
          <option value=''></option>
          <option value='United States'>United States</option>
          <option value='United Kingdom'>United Kingdom</option>
          <option value='Afghanistan'>Afghanistan</option>
        </select>
      "
      div = $("<div>").html(tmpl)
      $('body').append(div)
      select = div.find("select")
      select.chosen()
      
      container = div.find(".chosen-container")
      # Open the dropdown
      container.trigger("touchstart")
      
      # Get the results
      results = container.find(".chosen-results")
      activeResult = results.find(".active-result").first()
      
      # Simulate touch selection without a synthetic mouse event
      activeResult.trigger("touchstart")
      activeResult.trigger($.Event("touchend"))
      
      # Check that an option was selected
      expect(select.val()).toBe "United States"
      expect(document.activeElement).toBe container.find(".chosen-single")[0]
      
      # Cleanup
      div.remove()
