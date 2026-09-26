$ = jQuery

$.fn.extend({
  chosen: (options) ->
    # Do no harm and return as soon as possible for unsupported browsers, namely IE6 and IE7
    # Continue on if running IE document type but in compatibility mode
    return this unless AbstractChosen.browser_is_supported()
    this.each (input_field) ->
      $this = $ this
      chosen = $this.data('chosen')
      if options is 'destroy'
        if chosen instanceof Chosen
          chosen.destroy()
        return
      unless chosen instanceof Chosen
        $this.data('chosen', new Chosen(this, options))

      return

})

$.fn.chosen.browser_is_supported = AbstractChosen.browser_is_supported

class Chosen extends AbstractChosen

  setup: ->
    @form_field_jq = $ @form_field
    @original_tab_index = @form_field.getAttribute('tabindex')
    @current_selectedIndex = @form_field.selectedIndex
    @scroll_throttle_timeout = null
    @scroll_handler = () =>
      return if @scroll_throttle_timeout
      @scroll_throttle_timeout = setTimeout(() =>
        @scroll_throttle_timeout = null
        @update_dropup_position()
      , 16) # ~60fps
    @pageshow_handler = () => this.results_update_field()
    @window_blur_handler = () => this.close_field() if @results_showing

  set_up_html: ->
    container_classes = ["chosen-container"]
    container_classes.push "chosen-container-" + (if @is_multiple then "multi" else "single")
    container_classes.push @form_field.className if @inherit_select_classes && @form_field.className
    container_classes.push "chosen-rtl" if @is_rtl

    container_props =
      'class': container_classes.join ' '
      'title': @form_field.title

    container_props.id = @form_field.id.replace(/[^\w]/g, '_') + "_chosen" if @form_field.id.length

    @container = ($ "<div />", container_props)

    # CSP without 'unsafe-inline' doesn't allow setting the style attribute directly
    @container.width this.container_width()

    if @is_multiple
      @container.html this.get_multi_html()
    else
      @container.html this.get_single_html()

    @original_styles =
      position: @form_field.style.position
      opacity: @form_field.style.opacity
      display: @form_field.style.display
    @form_field_jq.css('position', 'absolute').css('opacity', 0)
    @form_field_jq.css('display', 'none') unless @form_field.required
    @form_field_jq.after @container
    @dropdown = @container.find('div.chosen-drop').first()

    @search_field = @container.find('input').first()
    @search_results = @container.find('ul.chosen-results').first()
    @search_results.attr('id', "#{@result_id_base}-search-results")
    @search_groups = @container.find('li.group-results').first()
    this.search_field_scale()

    @search_no_results = @container.find('li.no-results').first()

    if @is_multiple
      @search_choices = @container.find('ul.chosen-choices').first()
      @search_container = @container.find('li.search-field').first()
    else
      @search_container = @container.find('div.chosen-search').first()
      @selected_item = @container.find('.chosen-single').first()

    this.set_aria_labels()
    this.results_build()
    this.set_tab_index()
    this.set_label_behavior()

  on_ready: ->
    @form_field_jq.trigger("chosen:ready", {chosen: this})

  register_observers: ->
    $(window).on 'pageshow.chosen', @pageshow_handler
    $(window).on 'blur.chosen', @window_blur_handler

    @container.on 'touchstart.chosen', (evt) => this.container_mousedown(evt); return
    @container.on 'touchend.chosen', (evt) => this.container_mouseup(evt); return

    @container.on 'mousedown.chosen', (evt) => this.container_mousedown(evt); return
    @container.on 'mouseup.chosen', (evt) => this.container_mouseup(evt); return
    @container.on 'mouseenter.chosen', (evt) => this.mouse_enter(evt); return
    @container.on 'mouseleave.chosen', (evt) => this.mouse_leave(evt); return

    @search_groups.bind 'mouseup.chosen', (evt) => this.search_results_mouseup(evt); return
    @search_groups.bind 'mouseover.chosen', (evt) => this.search_results_mouseover(evt); return
    @search_groups.bind 'mouseout.chosen', (evt) => this.search_results_mouseout(evt); return

    @search_results.on 'mouseup.chosen', (evt) => this.search_results_mouseup(evt); return
    @search_results.on 'mouseover.chosen', (evt) => this.search_results_mouseover(evt); return
    @search_results.on 'mouseout.chosen', (evt) => this.search_results_mouseout(evt); return

    unless 'onwheel' of document
      @search_groups.bind 'mousewheel.chosen DOMMouseScroll.chosen', (evt) => this.search_results_mousewheel(evt); return
      @search_results.on 'mousewheel.chosen DOMMouseScroll.chosen', (evt) => this.search_results_mousewheel(evt); return

    @search_results.on 'touchstart.chosen', (evt) => this.search_results_touchstart(evt); return
    @search_results.on 'touchmove.chosen', (evt) => this.search_results_touchmove(evt); return
    @search_results.on 'touchend.chosen', (evt) => this.search_results_touchend(evt); return

    @form_field_observers =
      updated: (evt) => this.results_update_field(evt)
      activate: (evt) => this.activate_field(evt)
      open: (evt) => this.container_mousedown(evt)
      close: (evt) => this.close_field(evt)
    @form_field_jq.on "chosen:updated.chosen", @form_field_observers.updated
    @form_field_jq.on "chosen:activate.chosen", @form_field_observers.activate
    @form_field_jq.on "chosen:open.chosen", @form_field_observers.open
    @form_field_jq.on "chosen:close.chosen", @form_field_observers.close

    @search_field.on 'blur.chosen', (evt) => this.input_blur(evt); return
    @search_field.on 'keyup.chosen', (evt) => this.keyup_checker(evt); return
    @search_field.on 'keydown.chosen', (evt) => this.keydown_checker(evt); return
    @search_field.on 'focus.chosen', (evt) => this.input_focus(evt); return
    @search_field.on 'cut.chosen', (evt) => this.clipboard_event_checker(evt); return
    @search_field.on 'paste.chosen', (evt) => this.clipboard_event_checker(evt); return

    if @is_multiple
      @search_choices.on 'click.chosen', (evt) => this.choices_click(evt); return
    else
      @container.on 'click.chosen', (evt) -> evt.preventDefault(); return # gobble click of anchor
      @selected_item.on 'keydown.chosen', (evt) => this.selected_item_keydown(evt); return

  destroy: ->
    $(window).off 'pageshow.chosen', @pageshow_handler
    $(window).off 'blur.chosen', @window_blur_handler
    $(if @container[0].getRootNode? then @container[0].getRootNode() else @container[0].ownerDocument).off 'click.chosen', @click_test_action
    if @form_field_label.length > 0
      @form_field_label.off 'mousedown.chosen', this.label_mousedown_handler
      @form_field_label.off 'click.chosen', this.label_click_handler
    @form_field_jq.off "chosen:updated.chosen", @form_field_observers.updated
    @form_field_jq.off "chosen:activate.chosen", @form_field_observers.activate
    @form_field_jq.off "chosen:open.chosen", @form_field_observers.open
    @form_field_jq.off "chosen:close.chosen", @form_field_observers.close

    # Clean up scroll handler and pending timeout if dropdown is open
    if @results_showing
      $(window).off 'scroll.chosen', @scroll_handler
      clearTimeout(@scroll_throttle_timeout) if @scroll_throttle_timeout

    if @original_tab_index?
      @form_field.setAttribute('tabindex', @original_tab_index)
    else
      @form_field.removeAttribute('tabindex')

    @container.remove()
    @form_field_jq.removeData('chosen')
    @form_field.style.position = @original_styles.position
    @form_field.style.opacity = @original_styles.opacity
    @form_field.style.display = @original_styles.display

  set_aria_labels: ->
    for name in @copied_aria_attributes or []
      @search_field.removeAttr name
    @copied_aria_attributes = []
    for attribute in this.search_aria_attributes()
      @search_field.attr attribute.name, attribute.value
      @copied_aria_attributes.push attribute.name
    @search_field.attr "aria-owns", @search_results.attr "id"
    @search_field.attr "aria-controls", @search_results.attr "id"
    if not @form_field.attributes["aria-labelledby"] and not @form_field.attributes["aria-label"] and @form_field.labels?.length
      labelledbyList = ""
      for label, i in @form_field.labels
        if label.id is ""
          label.id = "#{@result_id_base}-label-#{i}"
        labelledbyList += @form_field.labels[i].id + " "
      @search_field.attr "aria-labelledby", labelledbyList
      @copied_aria_attributes.push "aria-labelledby"

  search_field_disabled: ->
    @is_read_only = @form_field.getAttribute('readonly') isnt null
    @is_disabled = @form_field.disabled || @form_field_jq.parents('fieldset').is(':disabled') || @is_read_only

    @container.toggleClass 'chosen-disabled', @is_disabled
    @container.toggleClass 'chosen-readonly', @is_read_only
    @search_field[0].disabled = @is_disabled

    unless @is_multiple
      @selected_item.attr 'aria-disabled', @is_disabled
      @selected_item.attr 'tabindex', if @is_disabled then -1 else 0

    if @is_disabled
      this.close_field()

  container_mousedown: (evt) ->
    return if @is_disabled
    is_choice_close = evt? and $(evt.target).closest('.search-choice-close').length > 0

    if evt and this.mousedown_checker(evt) == 'left'
      if evt and evt.type is "mousedown" and not @results_showing
        evt.preventDefault()

    if evt and evt.type in ['mousedown', 'touchstart'] and not @results_showing and not (evt.type is 'touchstart' and is_choice_close)
      evt.preventDefault()

    if not is_choice_close
      if not @active_field
        @search_field.val "" if @is_multiple
        $(if @container[0].getRootNode? then @container[0].getRootNode() else @container[0].ownerDocument).on 'click.chosen', @click_test_action
        this.results_show()
      else if @is_multiple and not @results_showing and not this.synthetic_activation_after_touch(evt)
        this.results_show()
      else if not @is_multiple and evt and (($(evt.target)[0] == @selected_item[0]) || $(evt.target).parents("a.chosen-single").length)
        evt.preventDefault()
        this.results_toggle()

      this.activate_field()

  container_mouseup: (evt) ->
    if not @is_disabled and @allow_single_deselect and $(evt.target).hasClass('search-choice-close')
      this.results_reset(evt)

  search_results_mousewheel: (evt) ->
    delta = evt.originalEvent.deltaY or -evt.originalEvent.wheelDelta or evt.originalEvent.detail if evt.originalEvent
    if delta?
      evt.preventDefault() unless evt.cancelable is false
      delta = delta * 40 if evt.type is 'DOMMouseScroll'
      @search_results.scrollTop(delta + @search_results.scrollTop())

  blur_test: (evt) ->
    this.close_field() if not @active_field and @container.hasClass "chosen-container-active"

  close_field: ->
    $(if @container[0].getRootNode? then @container[0].getRootNode() else @container[0].ownerDocument).off "click.chosen", @click_test_action

    @active_field = false
    this.results_hide()
    @search_field.attr("aria-expanded",false);

    @container.removeClass "chosen-container-active"
    @container.removeClass "chosen-dropup"
    this.clear_backstroke()

    this.show_search_field_default()
    this.search_field_scale()
    @search_field.trigger "blur"

  should_dropup: ->
    windowHeight = $(window).height()
    dropdownTop = @container.offset().top + @container.height() - $(window).scrollTop()
    totalHeight = @dropdown.height() + dropdownTop

    if totalHeight > windowHeight
      true
    else
      false

  update_dropup_position: ->
    return unless @results_showing

    if this.should_dropup()
      @container.addClass "chosen-dropup"
    else
      @container.removeClass "chosen-dropup"


  activate_field: ->
    return if @is_disabled

    @container.addClass "chosen-container-active"

    if this.should_dropup()
      @container.addClass "chosen-dropup"

    @active_field = true

    @search_field.val(@search_field.val())
    this.search_results.attr("aria-busy", false);
    @search_field.trigger "focus"


  test_active_click: (evt) ->
    active_container = $(evt.target).closest('.chosen-container')
    active_label = @form_field_label.length and (@form_field_label.is(evt.target) or @form_field_label.has(evt.target).length)
    active_form_field = evt.target is @form_field
    if active_label or active_form_field or (this.mousedown_checker(evt) == 'left' and active_container.length and @container[0] == active_container[0])
      @active_field = true
    else
      this.close_field()

  results_build: ->
    @parsing = true
    @selected_option_count = null

    @results_data = SelectParser.select_to_array(@form_field, @parser_config)

    if @is_multiple
      @search_choices.find("li.search-choice").remove()
    else
      this.single_set_selected_text()
      if @disable_search or @form_field.options.length <= @disable_search_threshold and not @create_option
        @search_field[0].readOnly = true
        @container.addClass "chosen-container-single-nosearch"
      else
        @search_field[0].readOnly = false
        @container.removeClass "chosen-container-single-nosearch"

    this.update_results_content this.results_option_build({first:true})

    this.search_field_disabled()
    this.show_search_field_default()
    this.search_field_scale()

    @parsing = false

  result_do_highlight: (el) ->
    if el.length
      this.result_clear_highlight()

      @result_highlight = el
      @result_highlight.addClass "highlighted"

      @search_field.attr("aria-activedescendant", @result_highlight.attr("id"))

      maxHeight = parseInt @search_results.css("maxHeight"), 10
      visible_top = @search_results.scrollTop()
      visible_bottom = maxHeight + visible_top

      high_top = @result_highlight.position().top + @search_results.scrollTop()
      high_bottom = high_top + @result_highlight.outerHeight()

      if high_bottom >= visible_bottom
        @search_results.scrollTop if (high_bottom - maxHeight) > 0 then (high_bottom - maxHeight) else 0
      else if high_top < visible_top
        @search_results.scrollTop high_top

  result_clear_highlight: ->
    @result_highlight.removeClass "highlighted" if @result_highlight
    @result_highlight = null
    @search_field.removeAttr "aria-activedescendant"

  results_show: ->
    if @is_multiple and @max_selected_options <= this.choices_count()
      @form_field_jq.trigger("chosen:maxselected", {chosen: this})
      return false

    if this.should_dropup()
      @container.addClass "chosen-dropup"

    @container.addClass "chosen-with-drop"
    @selected_item.attr("aria-expanded", true) unless @is_multiple
    @results_showing = true

    @search_field.attr("aria-expanded", true)
    @search_field.trigger "focus"
    @search_field.val this.get_search_field_value()

    this.winnow_results()
    @form_field_jq.trigger("chosen:showing_dropdown", {chosen: this})

    # Register scroll handler to dynamically adjust dropdown position
    $(window).on 'scroll.chosen', @scroll_handler

  update_results_content: (content) ->
    @search_results.html content

  update_empty_results_state: ->
    @container.toggleClass 'chosen-empty-results', @is_multiple and not @create_option and @search_results.children().length is 0

  fire_search_updated: (search_term) ->
    @form_field_jq.trigger("chosen:search_updated", {chosen: this, search_term: search_term})

  results_hide: ->
    if @results_showing
      this.result_clear_highlight()

      @container.removeClass "chosen-with-drop"
      @container.removeClass "chosen-dropup"
      @selected_item.attr("aria-expanded", false) unless @is_multiple
      @form_field_jq.trigger("chosen:hiding_dropdown", {chosen: this})

    @search_field.attr("aria-expanded", false)
    @results_showing = false

    # Unregister scroll handler and clear any pending timeout
    $(window).off 'scroll.chosen', @scroll_handler
    clearTimeout(@scroll_throttle_timeout) if @scroll_throttle_timeout


  set_tab_index: (el) ->
    if @form_field.tabIndex
      ti = @form_field.tabIndex
      @form_field.tabIndex = -1
      @search_field[0].tabIndex = ti
    @form_field.tabIndex = -1 if @form_field.required

  set_label_behavior: ->
    @form_field_label = @form_field_jq.parents("label") # first check for a parent label
    if not @form_field_label.length and @form_field.id.length
      @form_field_label = $("label[for='#{@form_field.id}']") #next check for a for=#{id}

    if @form_field_label.length > 0
      @form_field_label.on 'mousedown.chosen', this.label_mousedown_handler
      @form_field_label.on 'click.chosen', this.label_click_handler

  set_search_field_placeholder: ->
    if @is_multiple and this.choices_count() < 1
      @search_field.attr('placeholder', @default_text)
    else
      @search_field.attr('placeholder', '')

  show_search_field_default: ->
    @search_field.val('')
    do @set_search_field_placeholder
    if @is_multiple and this.choices_count() < 1 and not @active_field
      @search_field.addClass "default"
    else
      @search_field.removeClass "default"

  search_results_mouseup: (evt) ->
    if evt.type is 'touchend' or this.mousedown_checker(evt) == 'left'
      target = if $(evt.target).is ".active-result,.group-result" then $(evt.target) else $(evt.target).parents(".active-result").first()
      if target.length
        @result_highlight = target
        this.result_select(evt)
        @search_field.focus() if @is_multiple or @results_showing

  search_results_mouseover: (evt) ->
    target = if $(evt.target).hasClass "active-result" then $(evt.target) else $(evt.target).parents(".active-result").first()
    this.result_do_highlight( target ) if target

  search_results_mouseout: (evt) ->
    this.result_clear_highlight() if $(evt.target).hasClass("active-result") or $(evt.target).parents('.active-result').first().length

  choice_build: (item) ->
    choice = $('<li />', { class: "search-choice", "data-value": item.value, role: "option" }).html("<span>#{this.choice_label(item)}</span>")

    if item.disabled
      choice.addClass 'search-choice-disabled'
    else
      close_link = $('<button />', { type: 'button', tabindex: -1, class: 'search-choice-close', 'data-option-array-index': item.data['data-option-array-index'] }).html('<span class="visually-hidden focusable">' + AbstractChosen.default_remove_item_text + '</span>')
      close_link.on 'click.chosen', (evt) => this.choice_destroy_link_click(evt)
      choice.append close_link

    if @inherit_option_classes && item.classes
      choice.addClass item.classes

    @search_container.before  choice

  choice_destroy_link_click: (evt) ->
    evt.preventDefault()
    evt.stopPropagation()
    this.choice_destroy $(evt.currentTarget) unless @is_disabled

  choice_destroy: (link) ->
    if this.result_deselect( link[0].getAttribute("data-option-array-index") )
      if @active_field
        @search_field.trigger "focus"
      else
        this.show_search_field_default()

      this.results_hide() if @is_multiple and this.hide_results_on_select and this.choices_count() > 0 and this.get_search_field_value().length < 1

      link.parents('li').first().remove()

      do @set_search_field_placeholder
      this.search_field_scale()

  results_reset: ->
    this.reset_single_select_options()
    @form_field.options[0].selected = true
    this.single_set_selected_text()
    this.show_search_field_default()
    this.results_reset_cleanup()
    this.trigger_form_field_change()
    this.results_hide() if @active_field

  results_reset_cleanup: ->
    @current_selectedIndex = @form_field.selectedIndex
    @selected_item.find('.search-choice-close').remove()

  result_select: (evt) ->
    if $(evt.target).hasClass "group-result"
      if not @can_select_by_group or not @is_multiple
        return
      $(evt.target).nextAll().each (_, option) =>
        if not $(option).hasClass "group-result"
          array_index = $(option).attr "data-option-array-index"
          if $(option).hasClass('group-option') and $(option).hasClass('active-result') and not @results_data[array_index]?.selected
            @result_highlight = $(option)
            evt.target = option
            evt.selected = true
            this.result_select evt
        else return false
      return

    if @result_highlight
      high = @result_highlight

      if high.hasClass "create-option"
        this.select_create_option(@search_field.val())
        return this.results_hide()

      item = @results_data[ high[0].getAttribute("data-option-array-index") ]
      option = this.current_option_for(item)
      unless option?
        this.results_update_field()
        return false

      this.result_clear_highlight()

      if @is_multiple and @max_selected_options <= this.choices_count()
        @form_field_jq.trigger("chosen:maxselected", {chosen: this})
        return false

      if @is_multiple
        high.removeClass("active-result")
      else
        this.reset_single_select_options()
        @search_results.find('[role="option"][aria-selected="true"]').attr('aria-selected', 'false')

      high.addClass("result-selected")
      high.attr('aria-selected', 'true')

      item.selected = true

      option.selected = true
      @selected_option_count = null

      if @is_multiple
        this.choice_build item
      else
        this.single_set_selected_text(this.choice_label(item))

      if @is_multiple && (not @hide_results_on_select || (evt.metaKey or evt.ctrlKey))
        if evt.metaKey or evt.ctrlKey
          this.winnow_results(skip_highlight: true)
        else if this.get_search_field_value().length < 1
          this.winnow_results_after_select(item)
        else
          @search_field.val("")
          this.winnow_results()
      else
        this.results_hide()
        this.show_search_field_default()
        unless @is_multiple
          @search_field.trigger "blur"
          @selected_item.trigger "focus"

      this.trigger_form_field_change selected: option.value  if @is_multiple || @form_field.selectedIndex != @current_selectedIndex
      @current_selectedIndex = @form_field.selectedIndex

      evt.preventDefault()

      this.search_field_scale()

  single_set_selected_text: (text=@default_text) ->
    if text is @default_text
      @selected_item.addClass("chosen-default")
      text = this.escape_html(text)
    else
      this.single_deselect_control_build()
      @selected_item.removeClass("chosen-default")

    @selected_item.find("span").html(text)

  result_deselect: (pos) ->
    result_data = @results_data[pos]
    option = this.current_option_for(result_data)
    unless option?
      this.results_update_field()
      return false

    if not option.disabled
      result_data.selected = false

      option.selected = false
      @selected_option_count = null

      this.result_clear_highlight()
      this.winnow_results() if @results_showing

      this.trigger_form_field_change deselected: option.value
      this.search_field_scale()

      return true
    else
      return false

  single_deselect_control_build: ->
    return unless @allow_single_deselect
    unless @selected_item.find('.search-choice-close').length
      @selected_item.find('span').first().after '<button type="button" tabindex="-1" class="search-choice-close"></button>'
    @selected_item.addClass('chosen-single-with-deselect')

  get_search_field_value: ->
    @search_field.val()

  get_search_text: ->
    text = this.get_search_field_value()

    if text?
      String(text).trim()
    else
      ""

  escape_html: (text) ->
    $('<div/>').text(text).html()

  unescape_html: (text) ->
    # Safely decode common HTML entities without parsing HTML tags
    # This prevents double-encoding while maintaining security
    # Note: Sequential replacements may cause double-unescaping (e.g., &amp;amp; -> &amp; -> &)
    # This is intentional to handle cases where users incorrectly pre-escape their input
    # Security is maintained because we re-escape via escape_html() before template insertion
    text.replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&#x27;/g, "'")

  winnow_results_set_highlight: ->
    selected_results = if not @is_multiple then @search_results.find(".result-selected.active-result") else []
    do_high = if selected_results.length then selected_results.first() else @search_results.find(".active-result").first()

    this.result_do_highlight do_high if do_high?

  winnow_results_after_select: (item) ->
    scroll_position = @search_results.scrollTop()
    this.winnow_results(skip_highlight: true)
    active_results = @search_results.find(".active-result")
    next_result = active_results.filter((index, result) ->
      parseInt(result.getAttribute("data-option-array-index"), 10) > item.data["data-option-array-index"]
    ).first()
    next_result = active_results.last() unless next_result.length
    this.result_do_highlight(next_result) if next_result.length
    @search_results.scrollTop(scroll_position)

  no_results: (terms) ->
    no_results_html = this.get_no_results_html(terms)

    @search_results.append no_results_html
    @form_field_jq.trigger("chosen:no_results", {chosen:this})

  show_create_option: (terms) ->
    create_option_html = this.get_create_option_html(terms)
    @search_results.append create_option_html

  create_option_clear: ->
    @search_results.find(".create-option").remove()

  select_create_option: (terms) ->
    if $.isFunction(@create_option)
      @create_option.call this, terms
    else
      this.select_append_option( {value: terms, text: terms} )

  select_append_option: ( options ) ->
    option = this.get_option_element(options)
    @form_field_jq.append option
    @form_field_jq.trigger "chosen:updated"
    @form_field_jq.trigger "change"
    @search_field.trigger "focus"

  no_results_clear: ->
    @search_results.find(".no-results").remove()

  keydown_arrow: ->
    if @results_showing and @result_highlight
      next_sib = @result_highlight.nextAll("li.active-result").first()
      this.result_do_highlight next_sib if next_sib
    else if @results_showing and @create_option
      this.result_do_highlight(@search_results.find('.create-option'))
    else
      this.results_show()

  keyup_arrow: ->
    if not @results_showing and not @is_multiple
      this.results_show()
    else if @result_highlight
      prev_sibs = @result_highlight.prevAll("li.active-result")

      if prev_sibs.length
        this.result_do_highlight prev_sibs.first()
      else
        this.results_hide() if this.choices_count() > 0
        this.result_clear_highlight()

  keydown_backstroke: ->
    return unless @backspace_deletes_choices

    if @pending_backstroke
      this.choice_destroy @pending_backstroke.find('.search-choice-close').first()
      this.clear_backstroke()
    else
      next_available_destroy = @search_container.siblings("li.search-choice").last()
      if next_available_destroy.length and not next_available_destroy.hasClass("search-choice-disabled")
        @pending_backstroke = next_available_destroy
        if @single_backstroke_delete
          @keydown_backstroke()
        else
          @pending_backstroke.addClass "search-choice-focus"

  clear_backstroke: ->
    @pending_backstroke.removeClass "search-choice-focus" if @pending_backstroke
    @pending_backstroke = null

  search_field_scale: ->
    return unless @is_multiple

    style_block =
      position: 'absolute'
      left: '-1000px'
      top: '-1000px'
      display: 'none'
      whiteSpace: 'pre'

    styles = ['fontSize', 'fontStyle', 'fontWeight', 'fontFamily', 'lineHeight', 'textTransform', 'letterSpacing']

    for style in styles
      style_block[style] = @search_field.css(style)

    div = $('<div />').css(style_block)
    div.text @get_search_field_value() || @search_field.attr('placeholder')
    $('body').append div

    width = div.width() + 25
    div.remove()

    if @container.is(':visible')
      width = Math.min(@container.outerWidth() - 10, width)

    @search_field.width(width)

  trigger_form_field_change: (extra) ->
    @form_field_jq.trigger "input", extra
    @form_field_jq.trigger "change", extra
