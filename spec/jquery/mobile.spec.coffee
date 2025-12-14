describe "Mobile support", ->
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
      
      # Simulate touch selection - touchstart sets up touch state, mouseup performs selection
      activeResult.trigger("touchstart")
      activeResult.trigger($.Event("mouseup", which: 1))
      
      # Check that an option was selected
      expect(select.val()).toBe "United States"
      
      # Cleanup
      div.remove()
