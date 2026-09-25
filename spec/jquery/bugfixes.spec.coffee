describe "Bugfixes", ->
  it "recovers after clearing a search with no results", ->
    div = $("<div><select multiple><option value=''></option><option value='one'>One</option><option value='two'>Two</option></select></div>").appendTo("body")
    select = div.find("select").chosen
      search_contains: true
      max_selected_options: 1
    chosen = select.data("chosen")

    chosen.results_show()
    chosen.search_field.val("missing")
    chosen.results_search()
    expect(div.find(".no-results").length).toBe(1)

    chosen.search_field.val("")
    chosen.results_search()
    div.find(".active-result").first().trigger($.Event("mouseup", which: 1))

    expect(select[0].options[1].selected).toBe(true)
    expect(div.find(".search-choice > span").first().text()).toBe("One")
    div.remove()

  it "https://github.com/harvesthq/chosen/issues/2996 - XSS Vulnerability with `include_group_label_in_selected: true`", ->
    tmpl = "
      <select>
        <option value=''></option>
        <optgroup label='</script><script>console.log(1)</script>'>
          <option>an xss option</option>
        </optgroup>
      </select>
    "

    div = $("<div>").html(tmpl)
    select = div.find("select")

    select.chosen
      include_group_label_in_selected: true

    # open the drop
    container = div.find(".chosen-container")
    container.trigger("mousedown")

    xss_option = container.find(".active-result").last()
    expect(xss_option.html()).toBe "an xss option"

    # trigger the selection of the xss option
    xss_option.trigger("mouseup")

    # make sure the script tags are escaped correctly
    label_html = container.find("li.group-result").html()
    expect(label_html).toContain('&lt;/script&gt;&lt;script&gt;console.log(1)&lt;/script&gt;')
