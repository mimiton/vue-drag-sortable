<script src="../../Zine-electron/app/src/vuex/store.js"></script>
<template>
  <div class="app">
    <div class="pannel">
      <h1>Free drag & Vertical replace(Default mode)</h1>
      <div class="list">
        <sortable v-for="(item, index) in listData" v-model="dragData1" :key="item" :index="index" @sortend="sortend($event, listData)">
          Item {{ item }}
        </sortable>
      </div>
    </div>
    <div class="pannel">
      <h1>Vertical drag & Vertical replace</h1>
      <div class="list">
        <sortable v-for="(item, index) in listData" v-model="dragData2" :key="item" :index="index" @sortend="sortend($event, listData)" drag-direction="vertical">
          Item {{ item }}
        </sortable>
      </div>
    </div>
    <div class="pannel" style="width: auto;">
      <h1>Free drag & Horizontal replace</h1>
      <div class="list row">
        <sortable v-for="(item, index) in listData" v-model="dragData3" :key="item" :index="index" @sortend="sortend($event, listData)" drag-direction="horizontal" replace-direction="horizontal">
          Item {{ item }}
        </sortable>
      </div>
    </div>
  </div>
</template>

<script>
import Sortable from './DragSortable.vue';

export default {
  name: 'App',
  components: {
    Sortable
  },
  data () {
    return {
      dragData1: {},
      dragData2: {},
      dragData3: {},
      listData: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]
    }
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
.pannel > h1 {
  font-size: 16px;
}
.pannel {
  display: inline-block;
  width: 160px;
}
.list {
  position: relative;
}
.list > * {
  width: 100px;
  height: 40px;
  border: 1px solid;
}
.list.row > * {
  display: inline-block;
}
</style>
