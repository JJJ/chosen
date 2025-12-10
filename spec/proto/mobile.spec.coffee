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
      div = new Element('div').update(tmpl)
      document.body.insert(div)
      select = div.down('select')
      chosen = new Chosen(select)
      
      container = div.down('.chosen-container')
      # Simulate touchstart to open the dropdown
      touchstartEvent = document.createEvent('TouchEvent') if document.createEvent
      chosen.container_mousedown({ type: 'touchstart', preventDefault: -> })
      
      expect(container.hasClassName('chosen-container-active')).toBe true
      
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
      div = new Element('div').update(tmpl)
      document.body.insert(div)
      select = div.down('select')
      chosen = new Chosen(select)
      
      container = div.down('.chosen-container')
      # Open the dropdown
      chosen.container_mousedown({ type: 'touchstart', preventDefault: -> })
      
      # Get the first result
      results = container.down('.chosen-results')
      activeResult = results.select('.active-result').first()
      
      # Simulate touch selection
      chosen.search_results_touchstart({ target: activeResult })
      chosen.search_results_touchend({ target: activeResult })
      
      # Check that an option was selected
      expect(select.value).toBe 'United States'
      
      # Cleanup
      div.remove()
