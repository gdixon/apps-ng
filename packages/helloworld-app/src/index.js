import React, { useEffect, useState, useMemo } from 'react'
import styled from "styled-components"
import { observer } from 'mobx-react'
import { Button, Input, Spacer, useInput, useToasts } from '@zeit-ui/react'
import { Plus as PlusIcon } from '@zeit-ui/react-icons'

import { useStore } from "@/store"
import Container from '@/components/Container'
import UnlockRequired from '@/components/accounts/UnlockRequired'
import PushCommandButton from '@/components/PushCommandButton'

import { CONTRACT_HELLOWORLD, createHelloWorldAppStore } from './utils/AppStore'
import { reaction } from 'mobx'

const ButtonWrapper = styled.div`
  margin-top: 5px;
  width: 200px;
`;

/**
 * Header of the HelloWorld app page
 */
const AppHeader = () => (
  <Container>
    <h1>Secret Whispers!</h1>
  </Container>
)

/**
 * Body of the HelloWorld app page
 */
const AppBody = observer(() => {
  const { appRuntime, helloworldApp } = useStore();
  const [, setToast] = useToasts()
  const { state: whisp, bindings } = useInput('1')

  /**
   * Updates the whisper by querying the helloworld contract
   * The type definitions of `GetWhisper` request and response can be found at contract/helloworld.rs
   */
  async function updateWhisper () {
    if (!helloworldApp) return
    try {
      const response = await helloworldApp.queryWhisper(appRuntime)
      // Print the response in the original to the console
      console.log('Response::GetWhisper', response);

      helloworldApp.setWhisper(response.GetWhisper.whisper)
    } catch (err) {
      setToast(err.message, 'error')
    }
  }

  /**
   * The `setWhisper` transaction payload object
   * It follows the command type definition of the contract (at contract/helloworld.rs)
   */
  const setWhisperCommandPayload = useMemo(() => {
    // const num = whisp;
    
    return {
        SetWhisper: {
            whisper: whisp
        }
    }
  }, [whisp])

  return (
    <Container>
      <section>
        <div>PRuntime: {appRuntime ? 'yes' : 'no'}</div>
        <div>PRuntime ping: {appRuntime.latency || '+∞'}</div>
        <div>PRuntime connected: {appRuntime?.channelReady ? 'yes' : 'no'}</div>
      </section>
      <Spacer y={1}/>

      <h3>Super Sly Secret Whisper</h3>
      <section>
        <div>Last Whisper: {helloworldApp.whisper === null ? 'unknown' : helloworldApp.whisper}</div>
        <div><Button onClick={updateWhisper}>Update</Button></div>
      </section>
      <Spacer y={1}/>

      <h3>Set Whisper</h3>
      <section>
        <div>
          <Input label="Whisper" type="value" {...bindings} />
        </div>
        <ButtonWrapper>
          {/**  
            * PushCommandButton is the easy way to send confidential contract txs.
            * Below it's configurated to send HelloWorld::SetWhisper()
            */}
          <PushCommandButton
              // tx arguments
              contractId={CONTRACT_HELLOWORLD}
              payload={setWhisperCommandPayload}
              // display messages
              modalTitle='HelloWorld.SetWhisper()'
              modalSubtitle={`Set whisper value to ${whisp}`}
              onSuccessMsg='Tx succeeded'
              // button appearance
              buttonType='secondaryLight'
              icon={PlusIcon}
              name='Send'
            />
        </ButtonWrapper>
      </section>

    </Container>
  )
})

/**
 * Injects the mobx store to the global state once initialized
 */
const StoreInjector = observer(({ children }) => {
  const appStore = useStore()
  const [shouldRenderContent, setShouldRenderContent] = useState(false)

  useEffect(() => {
    if (!appStore || !appStore.appRuntime) return
    if (typeof appStore.helloworldApp !== 'undefined') return
    appStore.helloworldApp = createHelloWorldAppStore({})
  }, [appStore])

  useEffect(() => reaction(
    () => appStore.helloworldApp,
    () => {
      if (appStore.helloworldApp && !shouldRenderContent) {
        setShouldRenderContent(true)
      }
    },
    { fireImmediately: true })
  )

  return shouldRenderContent && children;
})

export default () => (
  <UnlockRequired>
    <StoreInjector>
      <AppHeader />
      <AppBody />
    </StoreInjector>
  </UnlockRequired>
)
