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
      div = new Element('div').update(tmpl)
      document.body.insert(div)
      select = div.down('select')
      new Chosen(select)
      
      # Check that chosen container was created
      container = div.down('.chosen-container')
      expect(container).not.toBeNull()
      expect(container.hasClassName('chosen-container-single')).toBe true
      
      # Cleanup
      div.remove()
