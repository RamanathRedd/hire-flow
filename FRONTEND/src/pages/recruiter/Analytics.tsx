import Navbar from "../../components/layout/Navbar";

const Analytics = () => {
  return (
    <>
      <Navbar leftTitle="Overall funnel" rightText="" classString="" />
      <div>
        <h4>142</h4>
        <p>Active Applications</p>
      </div>
      <div>
        <h4>37%</h4>
        <p>Screen - Interview</p>
      </div>
      <div>
        <h4>6.2d</h4>
        <p>Avg. time in stage</p>
      </div>
      <div>
        <h4>64%</h4>
        <p>Offer acceptance</p>
      </div>
      <div>
        <div>
          <p>Applied</p>
          <span></span>
          <p>142</p>
        </div>
        <div>
          <p>Screened</p>
          <span></span>
          <p>96</p>
        </div>
        <div>
          <p>Interview R1</p>
          <span></span>
          <p>48</p>
        </div>
        <div>
          <p>Interview R2</p>
          <span></span>
          <p>27</p>
        </div>
        <div>
          <p>Offer</p>
          <span></span>
          <p>11</p>
        </div>
        <div>
          <p>Hired</p>
          <span></span>
          <p>7</p>
        </div>
      </div>
    </>
  );
};

export default Analytics;
