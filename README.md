# vue-drag-sortable

> A vue dragging sortable component

## Install from NPM

``` bash
$ npm install --save vue-drag-sortable
```

### Usage
``` html
<template>
  <div class="list">
    <sortable v-for="(item, index) in listData"
      v-model="dragData"  <!-- (Required) Set an empty object to pass dragging data to each item -->
      :key="item" <!-- (Required) Loop key for each item -->
      :index="index" <!-- (Required) Index for each item -->
      drag-direction="vertical | horizontal" <!-- (Optional) Dragging mode, optional to vertical or horizontal -->
      replace-direction="vertical | horizontal" <!-- (Optional) Replacing mode(item reversing direction when mouse released), optional to vertical or horizontal -->
      @sortend="sortend($event, listData)" <!-- (Optional) Event triggered when sort end -->
      @sort="sorting" <!-- (Optional) Event triggered when sorting -->

      @real-click="click"
    >
      Item {{ item }}
    </sortable>
  </div>
</template>

<script>
import Sortable from 'vue-drag-sortable'

export default {
  comonents: {
    Sortable
  },
  data () {
    return {
      dragData: {},
      listData: [1,2,3,4,5,6,7,8,9,10]
    };
  },
  methods: {
    click (e) {
      // Todo
    },
    sort (e) {
      const { oldIndex, newIndex } = e
      console.log(oldIndex, newIndex)
    },
    sortend (e, list) {
      const { oldIndex, newIndex } = e
      this.rearrange(list, oldIndex, newIndex)
    },
    rearrange (array, oldIndex, newIndex) {
      if (oldIndex > newIndex) {
        array.splice(newIndex, 0, array[oldIndex])
        array.splice(oldIndex + 1, 1)
      }
      else {
        array.splice(newIndex + 1, 0, array[oldIndex])
        array.splice(oldIndex, 1)
      }
    }
  }
}
</script>

<style>
.list {
  position: relative; /* position of list container must be set to `relative` */
}
/* dragging item will be added with a `dragging` class */
/* so you can use this class to define the appearance of it */
.list > *.dragging {
  box-shadow: 0 2px 10px 0 rgba(0,0,0,.2);
}
</style>
```



### DEMO page
[vue-drag-sortable](https://mimiton.github.io/vue-drag-sortable/)