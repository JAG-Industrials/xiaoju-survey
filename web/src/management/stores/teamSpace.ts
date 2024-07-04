import {
  createSpace,
  updateSpace as updateSpaceReq,
  deleteSpace as deleteSpaceReq,
  getSpaceList as getSpaceListReq,
  getSpaceDetail as getSpaceDetailReq
} from '@/management/api/space'
import { CODE_MAP } from '@/management/api/base'
import { SpaceType } from '@/management/utils/types/workSpace'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useSurveyListStore } from './surveyList'
import { type SpaceDetail, type SpaceItem, type IWorkspace } from '@/management/utils/types/workSpace'


export const useTeamSpaceStore = defineStore('teamSpace', () => {
  // list空间
  const spaceMenus = ref([
    {
      icon: 'icon-wodekongjian',
      name: '我的空间',
      id: SpaceType.Personal
    },
    {
      icon: 'icon-tuanduikongjian',
      name: '团队空间',
      id: SpaceType.Group,
      children: []
    }
  ])
  const spaceType = ref(SpaceType.Personal)
  const workSpaceId = ref('')
  const spaceDetail = ref<SpaceDetail | null>(null)
  const teamSpaceList = ref<SpaceItem[]>([])

  const surveyListStore = useSurveyListStore()

  async function getSpaceList() {
    try {
      const res: any = await getSpaceListReq()

      if (res.code === CODE_MAP.SUCCESS) {
        const { list } = res.data
        const teamSpace = list.map((item: SpaceDetail) => {
          return {
            id: item._id,
            name: item.name
          }
        })
        teamSpaceList.value = list
        spaceMenus.value[1].children = teamSpace
      } else {
        ElMessage.error('getSpaceList' + res.errmsg)
      }
    } catch (err) {
      ElMessage.error('getSpaceList' + err)
    }
  }

  async function getSpaceDetail(id: string) {
    try {
      const _id = id || workSpaceId.value
      const res: any = await getSpaceDetailReq(_id)
      if (res.code === CODE_MAP.SUCCESS) {
        spaceDetail.value = res.data
      } else {
        ElMessage.error('getSpaceList' + res.errmsg)
      }
    } catch (err) {
      ElMessage.error('getSpaceList' + err)
    }
  }

  function changeSpaceType(id: SpaceType) {
    spaceType.value = id
  }

  function changeWorkSpace(id: string) {
    workSpaceId.value = id
    surveyListStore.resetSearch()
  }

  async function deleteSpace(id: string) {
    try {
      const res: any = await deleteSpaceReq(id)

      if (res.code === CODE_MAP.SUCCESS) {
        ElMessage.success('删除成功')
      } else {
        ElMessage.error(res.errmsg)
      }
    } catch (err: any) {
      ElMessage.error(err)
    }
  }

  async function updateSpace(params: Required<IWorkspace>) {
    const { _id: workspaceId, name, description, members } = params
    const res: any = await updateSpaceReq({ workspaceId, name, description, members })

    if (res?.code === CODE_MAP.SUCCESS) {
      ElMessage.success('更新成功')
    } else {
      ElMessage.error(res?.errmsg)
    }
  }

  async function addSpace(params: IWorkspace) {
    const { name, description, members } = params
    const res: any = await createSpace({ name, description, members })

    if (res.code === CODE_MAP.SUCCESS) {
      ElMessage.success('添加成功')
    } else {
      ElMessage.error('createSpace  code err' + res.errmsg)
    }
  }

  function setSpaceDetail(data: null | SpaceDetail) {
    spaceDetail.value = data
  }

  return {
    spaceMenus,
    spaceType,
    workSpaceId,
    spaceDetail,
    teamSpaceList,
    getSpaceList,
    getSpaceDetail,
    changeSpaceType,
    changeWorkSpace,
    addSpace,
    deleteSpace,
    updateSpace,
    setSpaceDetail
  }
})
