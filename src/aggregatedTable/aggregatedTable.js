/**
 * Created by IvanP on 04.07.2016.
 */

import HierarchyTable from './hierarchyTable.js';
import FixedHeader from './FixedHeader.js';

class AggregatedTable{
  /**
   * A class that unifies work with Aggregated tables. Enabling a fixed header, search functionality, sorting, hierarchy etc can be done here.
   * @param {HTMLTableElement} table - table on which the action is to be performed
   * @param {Object} hierarchy - config for {@link HierarchyTable}. See {@link HierarchyTable} docs for available object properties. If hierarchy.source is not defined, it will automatically receive value from `table`
   * @param {Object} fixedHeader - config for {@link FixedHeader}. See {@link FixedHeader} docs for available object properties. If hierarchy.source is not defined, it will automatically receive value from `table`
   * */
  constructor({table, hierarchy, fixedHeader}={}){
    this.hierarchy=null;
    if(hierarchy && typeof hierarchy == 'object'){
      // initialize hierarchy column to be parsed and presented as tree
      hierarchy.source = hierarchy.source||table;
      this.hierarchy = new HierarchyTable(hierarchy);
      this.data = this.hierarchy.data;
      //initialize buttons that will toggle between flat and tree view
      let buttonHost = this.hierarchy.source.querySelector(`thead>tr>td:nth-child(${this.hierarchy.column+1})`);
      this.addToggleButton(buttonHost,'hierarchy-tree',false,'Tree View');
      this.addToggleButton(buttonHost,'hierarchy-flat',true,'Flat View');
      if(this.hierarchy.search.enabled){this.addSearchBox(buttonHost);}
    }
    if(fixedHeader && typeof fixedHeader == 'object'){
      fixedHeader.source = fixedHeader.source||table;
      this.fixedHeader = new FixedHeader(fixedHeader);
      //initialize buttons that will toggle between flat and tree view in the original table
      let buttonHost = this.fixedHeader.clonedHeader.querySelector(`thead>tr>td:nth-child(${this.hierarchy.column+1})`);
      [].slice.call(buttonHost.children).forEach((item)=>{item.parentNode.removeChild(item)}); //clears hierarchy toggle buttons cloned from original header
      this.addToggleButton(buttonHost,'hierarchy-tree',false,'Tree View');
      this.addToggleButton(buttonHost,'hierarchy-flat',true,'Flat View');
      if(this.hierarchy.search.enabled){this.addSearchBox(buttonHost);}
    }
    this.source=table;
    this.init();
  }


  /**
   * Initializes the app
   * */
  init(){
    // for collapsable hierarchy we want to update cells in the fixed(floating) header.
    ['collapsed','uncollapsed','tree-view','flat-view'].forEach((eventNameChunk)=>{this.source.addEventListener(`reportal-table-hierarchy-${eventNameChunk}`,()=>{this.fixedHeader.resizeFixed()});})
  }

  /**
   * This function adds toggle buttons for hierarchy (to toggle the [flat-view/tree-view]{@link HierarchyTable#flat} mode) to the hierarchy column (here available as `this.hierarchy.column`).
   * This function is executed for both the original table and the cloned header.
   * @param {HTMLTableCellElement} host - reference to the cell which acts as a header for hierarchy column
   * @param {String} buttonClassChunk - the part of the icon-class name that follows the `.icon-`. Is used to reference the icon class, but also used for the button without the `.icon-` prefix
   * @param {Boolean} flat - Boolean to be set on [`hierarchy.flat`]{@link HierarchyTable#flat} when this button is clicked.
   * @param {String} [title] - the title that describes what the button does to be show on hover (is set to native attribute `title` on the button element)
   * */
  addToggleButton(host,buttonClassChunk,flat,title){
    let button = document.createElement('span'),
      buttonContainer = document.createElement('span');
    button.classList.add(`icon-${buttonClassChunk}`);
    buttonContainer.classList.add('btn', buttonClassChunk);
    buttonContainer.title=title;
    if(flat==this.hierarchy.flat){buttonContainer.classList.add('active');}
    buttonContainer.addEventListener('click',(e)=>{
      if(flat==this.hierarchy.flat){return;} else {
        this.hierarchy.flat = flat;
        // we want to get all hier. toggle buttons in both cloned header and the table itself
        let hierColumnButtons = this.hierarchy.source.parentNode.querySelectorAll(`table>thead>tr>td:nth-child(${this.hierarchy.column+1})>.btn`);
        if(hierColumnButtons){[].slice.call(hierColumnButtons).forEach((item)=>{
          //By default one button is already `.active`, we need just to swap the `.active` class on them
          !item.classList.contains('active')?item.classList.add('active'):item.classList.remove('active');
        })}
      }
    });
    buttonContainer.appendChild(button);
    host.appendChild(buttonContainer);
  }

  addSearchBox(host){
    let button = document.createElement('span'),
        buttonContainer = document.createElement('span'),
        searchfield = document.createElement('input');

    searchfield.type='text';
    button.classList.add('icon-search');
    buttonContainer.classList.add('btn');
    buttonContainer.title='Search categories';

    searchfield.addEventListener('keyup',e=>{
      this.updateSearchTarget(e); //update search parameters
      efficientSearch(); // debounce search
    });

    var efficientSearch = this.search();

    buttonContainer.appendChild(button);
    buttonContainer.appendChild(searchfield);
    host.appendChild(buttonContainer);

  }

  updateSearchTarget(e){
    this.hierarchy.search.target = e.target;
    this.hierarchy.search.query = e.target.value;
  }

  search(){
    let hierarchy =this.hierarchy,
        settings = hierarchy.search;
    return this.constructor.debounce(function(){
      let value = settings.query;
      if(value.length>0){
        if(!settings.searching){settings.searching=true;}
        hierarchy.searchRowheaders(value);
      } else {
        settings.searching=false;
      }
    }, settings.timeout, settings.immediate);

  }

  /**
   * A debouncing function, used for cases when as `func` function needs to be called less often, after a certain `wait` timeout or `immediate`-ly
   * @param {Function} func - the function that needs to be executed at a lesser rate
   * @param {Number} [wait=300] - timeout after which the `func`tion executes
   * @param {Boolean} [immediate=false] - flag to be set when function needs to be executed immediately (overrides `wait` timeout)
   * */
  static debounce (func, wait=300, immediate=false){
    var timeout;
    return ()=>{
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    };
  }


}

export default AggregatedTable;
