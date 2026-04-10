import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("VotingSimpleModule", (m) => {
  const voting = m.contract("VotingSimple", [["Alice", "Bob", "Charlie", "David"]]);

  return { voting };
});
