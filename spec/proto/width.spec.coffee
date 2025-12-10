describe "Width handling", ->
  
  describe "min-width for short values", ->
    
    it "should apply min-width to single select containers", ->
      tmpl = "
        <select data-placeholder='Select a year...'>
          <option value=''></option>
          <option value='2020'>2020</option>
          <option value='2021'>2021</option>
          <option value='2022'>2022</option>
          <option value='2023'>2023</option>
          <option value='2024'>2024</option>
        </select>
      "
      div = new Element("div").update(tmpl)
      document.body.appendChild(div)
      select = div.down("select")
      new Chosen(select)
      
      container = div.down(".chosen-container-single")
      expect(container).toBeDefined()
      
      # Check that the container width is at least 80px
      # This verifies the min-width CSS is working
      containerWidth = container.getWidth()
      expect(containerWidth).toBeGreaterThanOrEqual(80)
      
      div.remove()
    
    it "should display short values without truncation", ->
      tmpl = "
        <select data-placeholder='Select...'>
          <option value=''></option>
          <option value='A'>A</option>
          <option value='B'>B</option>
          <option value='C'>C</option>
        </select>
      "
      div = new Element("div").update(tmpl)
      document.body.appendChild(div)
      select = div.down("select")
      new Chosen(select)
      
      # Select a short value
      container = div.down(".chosen-container")
      container.fire("mousedown") # open the drop
      container.down(".active-result").fire(simulant("mouseup", button: 0))
      
      # Check that the selected text is visible
      span = div.down(".chosen-single span")
      expect(span.textContent).toBe("A")
      
      # The container should be wide enough
      containerWidth = container.getWidth()
      expect(containerWidth).toBeGreaterThanOrEqual(80)
      
      div.remove()
    
    it "should display 4-digit years without truncation", ->
      tmpl = "
        <select>
          <option value=''></option>
          <option value='2013'>2013</option>
          <option value='2014'>2014</option>
          <option value='2015'>2015</option>
          <option value='2016'>2016</option>
          <option value='2017'>2017</option>
          <option value='2018'>2018</option>
          <option value='2019'>2019</option>
          <option value='2020'>2020</option>
        </select>
      "
      div = new Element("div").update(tmpl)
      document.body.appendChild(div)
      select = div.down("select")
      new Chosen(select)
      
      # Select a year
      container = div.down(".chosen-container")
      container.fire("mousedown") # open the drop
      container.down(".active-result").fire(simulant("mouseup", button: 0))
      
      # Check that the year is fully visible
      span = div.down(".chosen-single span")
      expect(span.textContent).toBe("2013")
      
      # Verify the container has adequate width
      containerWidth = container.getWidth()
      expect(containerWidth).toBeGreaterThanOrEqual(80)
      
      # Check that text is not truncated
      spanElement = span
      expect(spanElement.scrollWidth).toBeLessThanOrEqual(spanElement.clientWidth + 1)
      
      div.remove()
    
    it "should allow wider content to expand naturally", ->
      tmpl = "
        <select data-placeholder='Select a country...'>
          <option value=''></option>
          <option value='US'>United States of America</option>
          <option value='UK'>United Kingdom</option>
        </select>
      "
      div = new Element("div").update(tmpl)
      document.body.appendChild(div)
      select = div.down("select")
      new Chosen(select)
      
      # Select a long value
      container = div.down(".chosen-container")
      container.fire("mousedown") # open the drop
      container.down(".active-result").fire(simulant("mouseup", button: 0))
      
      # The container should be wider than the minimum
      containerWidth = container.getWidth()
      expect(containerWidth).toBeGreaterThan(80)
      
      div.remove()
