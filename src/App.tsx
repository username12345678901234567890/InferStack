import { HashRouter, Link, Route, Routes, useLocation } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Button, Empty } from './components/ui'
import Home from './pages/Home'
import Models from './pages/Models'
import ModelDetail from './pages/ModelDetail'
import Chat from './pages/Chat'
import Rankings from './pages/Rankings'
import Docs from './pages/Docs'
import Pricing from './pages/Pricing'
import Keys from './pages/Keys'
import Credits from './pages/Credits'
import Activity from './pages/Activity'
import Settings from './pages/Settings'
import SignIn from './pages/SignIn'
import MyModels, { MyModelDetail } from './pages/MyModels'
import DeployHome from './pages/deploy/DeployHome'
import DeployWizard from './pages/deploy/DeployWizard'

/** ?source=…&repo=… 가 바뀌면 같은 라우트라도 마법사를 새로 시작 */
function KeyedDeployWizard() {
  const { search } = useLocation()
  return <DeployWizard key={search} />
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="models" element={<Models />} />
          <Route path="models/:org/:name" element={<ModelDetail />} />
          <Route path="chat" element={<Chat />} />
          <Route path="rankings" element={<Rankings />} />
          <Route path="docs" element={<Docs />} />
          <Route path="pricing" element={<Pricing />} />
          <Route path="keys" element={<Keys />} />
          <Route path="credits" element={<Credits />} />
          <Route path="activity" element={<Activity />} />
          <Route path="settings" element={<Settings />} />
          <Route path="signin" element={<SignIn />} />
          <Route path="deploy" element={<DeployHome />} />
          <Route path="deploy/new" element={<KeyedDeployWizard />} />
          <Route path="my-models" element={<MyModels />} />
          <Route path="my-models/:slug" element={<MyModelDetail />} />
          <Route
            path="*"
            element={
              <Empty
                title="페이지를 찾을 수 없습니다"
                action={
                  <Link to="/">
                    <Button variant="outline">홈으로</Button>
                  </Link>
                }
              />
            }
          />
        </Route>
      </Routes>
    </HashRouter>
  )
}
