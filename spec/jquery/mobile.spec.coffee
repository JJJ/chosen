describe "Mobile support", ->
  describe "browser_is_supported", ->
    originalUserAgent = null
    
    beforeEach ->
      originalUserAgent = window.navigator.userAgent
    
    afterEach ->
      # Restore original userAgent
      Object.defineProperty window.navigator, 'userAgent',
        value: originalUserAgent
        writable: true
        configurable: true
    
    it "should support iPhone", ->
      # Mock iPhone user agent
      Object.defineProperty window.navigator, 'userAgent',
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
        writable: true
        configurable: true
      
      expect(AbstractChosen.browser_is_supported()).toBe true
    
    it "should support iPad", ->
      # Mock iPad user agent
      Object.defineProperty window.navigator, 'userAgent',
        value: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
        writable: true
        configurable: true
      
      expect(AbstractChosen.browser_is_supported()).toBe true
    
    it "should support Android mobile", ->
      # Mock Android mobile user agent
      Object.defineProperty window.navigator, 'userAgent',
        value: 'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36'
        writable: true
        configurable: true
      
      expect(AbstractChosen.browser_is_supported()).toBe true
    
    it "should support Windows Phone", ->
      # Mock Windows Phone user agent
      Object.defineProperty window.navigator, 'userAgent',
        value: 'Mozilla/5.0 (Windows Phone 10.0; Android 6.0.1; Microsoft; Lumia 950)'
        writable: true
        configurable: true
      
      expect(AbstractChosen.browser_is_supported()).toBe true
    
    it "should support BlackBerry", ->
      # Mock BlackBerry user agent
      Object.defineProperty window.navigator, 'userAgent',
        value: 'Mozilla/5.0 (BlackBerry; U; BlackBerry 9900; en-US)'
        writable: true
        configurable: true
      
      expect(AbstractChosen.browser_is_supported()).toBe true

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
      select = div.find("select")
      select.chosen()
      
      # Check that chosen container was created
      container = div.find(".chosen-container")
      expect(container.length).toBe 1
      expect(container.hasClass("chosen-container-single")).toBe true
    
    it "should handle touchstart events", ->
      tmpl = "
        <select data-placeholder='Choose a Country...'>
          <option value=''></option>
          <option value='United States'>United States</option>
          <option value='United Kingdom'>United Kingdom</option>
          <option value='Afghanistan'>Afghanistan</option>
        </select>
      "
      div = $("<div>").html(tmpl)
      select = div.find("select")
      select.chosen()
      
      container = div.find(".chosen-container")
      # Simulate touchstart to open the dropdown
      container.trigger("touchstart")
      expect(container.hasClass("chosen-container-active")).toBe true
    
    it "should handle touchend on results", ->
      tmpl = "
        <select data-placeholder='Choose a Country...'>
          <option value=''></option>
          <option value='United States'>United States</option>
          <option value='United Kingdom'>United Kingdom</option>
          <option value='Afghanistan'>Afghanistan</option>
        </select>
      "
      div = $("<div>").html(tmpl)
      select = div.find("select")
      select.chosen()
      
      container = div.find(".chosen-container")
      # Open the dropdown
      container.trigger("touchstart")
      
      # Get the results
      results = container.find(".chosen-results")
      activeResult = results.find(".active-result").first()
      
      # Simulate touch selection
      activeResult.trigger("touchstart")
      activeResult.trigger("touchend")
      
      # Check that an option was selected
      expect(select.val()).toBe "United States"
