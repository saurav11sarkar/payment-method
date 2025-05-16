import React from "react";

const TranId = async ({ params }) => {
  const { tran_id } = await params;
  console.log(tran_id);
  return <div>TranId {tran_id}</div>;
};

export default TranId;
