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
