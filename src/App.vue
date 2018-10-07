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
    <div class="pannel" style="width: 430px;">
      <h1>Free drag & Horizontal replace</h1>
      <div class="list row">
        <sortable v-for="(item, index) in listData" v-model="dragData3" :key="item" :index="index" @sortend="sortend($event, listData)" replace-direction="horizontal">
          Item {{ item }}
        </sortable>
      </div>
    </div>
    <div class="pannel" style="width: 2200px;">
      <h1>Horizontal drag & Horizontal replace</h1>
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
  vertical-align: top;
  width: 160px;
}
.list {
  position: relative;
  height: 400px;
  overflow: auto;
}
.list > * {
  width: 100px;
  height: 40px;
  background: white;
  border: 1px solid #f0f0f0;
}
.list > .dragging {
  box-shadow: 0 2px 10px 0 rgba(0,0,0,.2);
}
.list.row > * {
  display: inline-block;
}
</style>
