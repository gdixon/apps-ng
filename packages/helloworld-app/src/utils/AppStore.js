import { types, flow } from 'mobx-state-tree'

export const CONTRACT_HELLOWORLD = 5;

export const createHelloWorldAppStore = (defaultValue = {}, options = {}) => {
  const HelloWorldAppStore = types
    .model('HelloWorldAppStore', {
      whisper: types.maybeNull(types.string)
    })
    .actions(self => ({
      setWhisper (num) {
        self.whisper = num
      },
      async queryWhisper (runtime) {
        return await runtime.query(CONTRACT_HELLOWORLD, 'GetWhisper')
      }
    }))

  return HelloWorldAppStore.create(defaultValue)
}

