import TopBar from "../components/TopBar";
import WorkflowBuilder from "../components/WorkflowBuilder";
import Palette from "../components/Palette";
import SidePanel from "../components/SidePanel";

const Index = () => {
  return (
    <div className="h-screen flex flex-col bg-workflow-canvas">
      <TopBar />
      <div className="flex-1 flex overflow-hidden">
        <Palette />
        <WorkflowBuilder />
        <SidePanel />
      </div>
    </div>
  );
};

export default Index;
