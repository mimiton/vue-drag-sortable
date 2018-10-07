# vue-drag-sortable

> A vue dragging sortable component

## Install from NPM

``` bash
$ npm install --save vue-drag-sortable
```

### Usage
``` vue
<template>
  <div class="list">
    <sortable v-for="(item, index) in listData" v-model="dragData" :key="item" :index="index" @sortend="sortend($event, listData)">
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
    sortend (e, list) {
      const { oldIndex, newIndex } = e;
      this.rearrange(list, oldIndex, newIndex);
    },
    rearrange (array, oldIndex, newIndex) {
      if (oldIndex > newIndex) {
        array.splice(newIndex, 0, array[oldIndex]);
        array.splice(oldIndex + 1, 1);
      }
      else {
        array.splice(newIndex + 1, 0, array[oldIndex]);
        array.splice(oldIndex, 1);
      }
    }
  }
}
</script>

<style>
.list {
  position: relative;
}
</style>
```

### DEMO page
[vue-drag-sortable](https://mimiton.github.io/vue-drag-sortable/)